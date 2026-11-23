/**
 * Turns a product's plain-text description / ingredients / how-to-use into
 * blocks the product page can lay out.
 *
 * The admin stores these fields as plain text with line breaks, and the texts
 * follow a few loose conventions (see the existing rows and the content
 * drafts): «Крок 1. …» lines, «• …» bullets, a line ending with a colon as a
 * subheading («Важливо:», «Повний склад (INCI):»), «Поєднання: …» as a
 * labelled line, and a bare INCI list. Nothing here changes the text itself,
 * only how it is grouped; anything that matches no convention stays a
 * paragraph, so an unusual text still reads exactly as it was written.
 */

export interface ListItem {
  /** «Гіалуронат натрію» in «• Гіалуронат натрію (Sodium Hyaluronate) — …». */
  term?: string;
  /** «Sodium Hyaluronate»: the INCI name given in brackets after the term. */
  inci?: string;
  text: string;
}

export type ProductTextBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "labeled"; label: string; text: string }
  | { type: "steps"; items: { n: number; text: string }[] }
  | { type: "list"; items: ListItem[] }
  | { type: "inci"; text: string };

const STEP = /^(?:Крок|Step)\s*(\d+)\s*[.:)]\s*(.+)$/i;
const BULLET = /^[•·▪●–-]\s+(.+)$/;
// A whole line that ends with a colon: «Важливо:», «Спосіб використання:».
const HEADING = /^([^:]{2,60}):$/;
// «Поєднання: …», «Pairs well with: …», «АКТИВИ: 10». Short label only, so a
// sentence that merely contains a colon stays a paragraph.
const LABELED = /^([^:]{2,30}):\s+(.+)$/;
// «Term (INCI name) — explanation»; the bracket may hold one nested bracket,
// as in «Prunus Armeniaca (Apricot) Seed Powder». Long enough for a bracket
// that lists a whole complex («Arginine, Taurine, Betaine, …»).
const TERM = /^(.{2,180}?)\s+[—–]\s+(.+)$/;
// Only lists under «Ключові компоненти» / «Key ingredients» are term lists. In
// «Важливо» a dash is just part of the sentence and must not turn bold.
const TERM_LIST_HEADING = /компонент|інгредієнт|ingredient/i;
const TERM_INCI = /^(.*?)\s*\(((?:[^()]|\([^()]*\))+)\)$/;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

/** Mostly Latin letters and many commas: a bare INCI list. */
export function looksLikeInci(line: string): boolean {
  const commas = (line.match(/,/g) ?? []).length;
  if (commas < 6) return false;
  const letters = line.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return false;
  const latin = letters.filter((ch) => /[A-Za-z]/.test(ch)).length;
  return latin / letters.length >= 0.9;
}

/** «нанести на вологе…» after «Спосіб використання:» reads as a sentence start. */
function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase("uk") + s.slice(1);
}

function toListItem(text: string, withTerm: boolean): ListItem {
  const m = withTerm ? text.match(TERM) : null;
  if (!m) return { text };
  const [, rawTerm, rest] = m;
  const inci = rawTerm.match(TERM_INCI);
  if (inci && inci[1]) return { term: inci[1], inci: inci[2], text: rest };
  return { term: rawTerm, text: rest };
}

export function parseProductText(input: string | null | undefined): ProductTextBlock[] {
  if (!input) return [];
  const lines = input.replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim());
  const blocks: ProductTextBlock[] = [];
  // The INCI list right after a «… (INCI):» heading is styled as one even if
  // it is short.
  let inciNext = false;
  let termList = false;

  for (const line of lines) {
    if (!line) continue;
    const last = blocks[blocks.length - 1];

    const step = line.match(STEP);
    if (step) {
      const item = { n: Number(step[1]), text: step[2] };
      if (last?.type === "steps") last.items.push(item);
      else blocks.push({ type: "steps", items: [item] });
      inciNext = false;
      continue;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      const item = toListItem(bullet[1], termList);
      if (last?.type === "list") last.items.push(item);
      else blocks.push({ type: "list", items: [item] });
      inciNext = false;
      continue;
    }

    if (inciNext || looksLikeInci(line)) {
      blocks.push({ type: "inci", text: line });
      inciNext = false;
      continue;
    }

    const heading = line.match(HEADING);
    if (heading && wordCount(heading[1]) <= 6) {
      blocks.push({ type: "heading", text: heading[1] });
      inciNext = /INCI/i.test(heading[1]);
      termList = TERM_LIST_HEADING.test(heading[1]);
      continue;
    }

    const labeled = line.match(LABELED);
    if (labeled && wordCount(labeled[1]) <= 3) {
      blocks.push({ type: "labeled", label: labeled[1], text: labeled[2] });
      continue;
    }

    blocks.push({ type: "paragraph", text: capitalize(line) });
  }

  return blocks;
}
