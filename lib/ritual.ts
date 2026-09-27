/**
 * The "full care ritual" block on a product page.
 *
 * A ritual is a routine: shampoo → conditioner → mask → leave-in. The block used
 * to offer four more products from the page's own category, so a shampoo page
 * suggested four more shampoos under a heading about combining one line. Now it
 * offers one product for each step the shopper doesn't have yet, from the same
 * line where the brand makes one, unless the admin picked the set by hand.
 *
 * Everything here reads the Ukrainian `name`. The catalogue has no step or line
 * column, but the brand names every product after both ("Гіалуронова маска…",
 * "Кондиціонер для волосся з гіалуроновою кислотою"). Localize after, not before.
 */
import type { Product } from "@/types";

export type CareStep = "cleanse" | "condition" | "mask" | "leave_in";

export const CARE_STEPS: readonly CareStep[] = ["cleanse", "condition", "mask", "leave_in"];

/** How many products the admin may pick for one ritual — one per remaining step. */
export const MAX_RITUAL_PRODUCTS = 3;

/**
 * The routine step a product belongs to, or null for anything outside hair care
 * (a brush, a gift set). Leave-in is checked first: "VELVET CREAM незмивний
 * крем-кондиціонер" stays on the hair, it is not a rinse-off conditioner.
 */
export function careStep(name: string): CareStep | null {
  const n = name.toLowerCase();
  if (/незмивн|bb-крем|флюїд|спрей|тонік/.test(n)) return "leave_in";
  if (n.includes("шампунь")) return "cleanse";
  if (/маска|обгортання/.test(n)) return "mask";
  if (n.includes("кондиціонер")) return "condition";
  return null;
}

/**
 * Lines as the brand builds them: around one active, named in every product of
 * the line. Stems, so one entry matches every form of the word.
 */
const LINE_STEMS = [
  "гіалурон", "колаген", "амінокисл", "мультивітамін", "аміно-церамід", "harmony",
  "міцеляр", "шоколад", "чорниц", "інка-інчі", "центел", "трегалоз", "шовк", "протеїн",
];

/**
 * Products made for one kind of hair or scalp. They join a ritual only next to
 * a product for the same need or of the same line: offering a colour-care
 * conditioner or a men's shampoo to every other shopper would be a guess.
 */
const NEED_STEMS = [
  "фарбов", "знебарвл", "чоловік", "чутлив", "себобаланс", "детокс",
  "пілінг", "ексфоліант", "глибокого очищення",
];

function stemsIn(name: string, stems: readonly string[]): string[] {
  const n = name.toLowerCase();
  return stems.filter((s) => n.includes(s));
}

function countShared(a: readonly string[], b: readonly string[]): number {
  return a.filter((s) => b.includes(s)).length;
}

/** What the ritual reads from a product. Pages pass whole rows and get them back. */
export type RitualCandidate = Pick<Product, "id" | "name" | "in_stock" | "is_coming_soon" | "likes_count">;

/**
 * - curated: picked by hand in the admin;
 * - line: every suggestion is from the product's own line;
 * - complement: at least one step had to come from elsewhere.
 */
export type RitualKind = "curated" | "line" | "complement";

export interface RitualItem<T> {
  product: T;
  step: CareStep | null;
  isMain: boolean;
}

export interface Ritual<T> {
  kind: RitualKind;
  /** The product itself included, in routine order. Empty when there is nothing to offer. */
  items: RitualItem<T>[];
}

export function buildRitual<T extends RitualCandidate>(
  main: T & { ritual_ids?: string[] | null },
  catalogue: readonly T[],
): Ritual<T> {
  const available = catalogue.filter((p) => p.id !== main.id && p.in_stock && !p.is_coming_soon);

  // A hand-picked set wins. Picks that are gone or out of stock drop out; if
  // none is left, the page falls back to the automatic set rather than hiding.
  const curated = [...new Set(main.ritual_ids ?? [])]
    .map((id) => available.find((p) => p.id === id))
    .filter((p): p is T => p !== undefined)
    .slice(0, MAX_RITUAL_PRODUCTS);
  if (curated.length > 0) return inRoutineOrder(main, curated, "curated");

  const mainStep = careStep(main.name);
  if (!mainStep) return { kind: "complement", items: [] };

  const mainLines = stemsIn(main.name, LINE_STEMS);
  const mainNeeds = stemsIn(main.name, NEED_STEMS);
  const picks: T[] = [];
  let sameLine = true;

  for (const step of CARE_STEPS) {
    if (step === mainStep) continue;
    const best = available
      .filter((p) => careStep(p.name) === step)
      .map((p) => {
        const needs = stemsIn(p.name, NEED_STEMS);
        return {
          p,
          lines: countShared(stemsIn(p.name, LINE_STEMS), mainLines),
          needs: countShared(needs, mainNeeds),
          specialised: needs.length > 0,
        };
      })
      .filter((c) => !c.specialised || c.lines > 0 || c.needs > 0)
      // Same line first, then the same need, then what shoppers like most.
      .sort(
        (a, b) =>
          b.lines - a.lines ||
          b.needs - a.needs ||
          (b.p.likes_count ?? 0) - (a.p.likes_count ?? 0) ||
          a.p.name.localeCompare(b.p.name, "uk"),
      )[0];
    if (!best) continue;
    picks.push(best.p);
    if (best.lines === 0) sameLine = false;
  }

  return inRoutineOrder(main, picks, sameLine ? "line" : "complement");
}

function inRoutineOrder<T extends RitualCandidate>(main: T, others: T[], kind: RitualKind): Ritual<T> {
  if (others.length === 0) return { kind, items: [] };
  const rank = (step: CareStep | null) => (step ? CARE_STEPS.indexOf(step) : CARE_STEPS.length);
  const items = [main, ...others]
    .map((product) => ({ product, step: careStep(product.name), isMain: product.id === main.id }))
    // Stable sort: products without a step keep the admin's order, at the end.
    .sort((a, b) => rank(a.step) - rank(b.step));
  return { kind, items };
}

/** What the admin form saves: the picked slots without blanks, repeats or the product itself. */
export function normalizeRitualIds(ids: readonly string[], selfId?: string): string[] {
  return [...new Set(ids.filter((id) => id && id !== selfId))].slice(0, MAX_RITUAL_PRODUCTS);
}
