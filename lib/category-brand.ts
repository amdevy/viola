/**
 * Which product line a category belongs to, and the brand wording that goes
 * with it.
 *
 * The category page used to hardcode "Na Gólov[y] / На Голову" into every
 * title, H1, description, keyword list and intro paragraph. That is correct for
 * hair, and wrong the moment a second line exists: "Гелі для душу На Голову"
 * names the wrong brand, confuses the reader, and spends the shop's strongest
 * keyword on a page that cannot rank for it anyway.
 *
 * Resolution is by the ROOT of the category branch, so a subcategory inherits
 * its line automatically and adding a product line means adding one entry here.
 */

export type BrandLine = {
  /** Eyebrow above the H1. */
  eyebrow: string;
  /** Latin stylisation, as the brand writes it. */
  latin: string;
  /** Ukrainian brand name. Note: "На Голову", never "На Голови". */
  uk: string;
  /** What the line is for — completes "аромакосметика ___". */
  subjectUk: string;
  subjectEn: string;
  /** Extra brand keywords appended to every category in the line. */
  keywordsUk: string[];
  keywordsEn: string[];
};

const HAIR: BrandLine = {
  eyebrow: "Na Gólov[y]",
  latin: "Na Gólov[y]",
  uk: "На Голову",
  subjectUk: "для волосся",
  subjectEn: "for hair",
  keywordsUk: [
    "Na Golovy",
    "Na Gólov[y]",
    "на голову",
    "На Голову",
    "na golovy купити",
    "на голову купити",
    "професійна косметика для волосся",
    "українська косметика для волосся",
  ],
  keywordsEn: [
    "Na Golovy",
    "Na Gólov[y]",
    "Ukrainian hair cosmetics",
    "professional hair care",
  ],
};

const SKIN: BrandLine = {
  eyebrow: "Na WKIR[y]",
  latin: "Na WKIR[y]",
  uk: "На Шкіру",
  subjectUk: "для тіла та обличчя",
  subjectEn: "for body and face",
  keywordsUk: [
    "Na WKIRy",
    "Na WKIR[y]",
    "на шкіру",
    "На Шкіру",
    "на шкіру купити",
    "українська косметика для тіла",
    "професійна косметика для тіла",
  ],
  keywordsEn: [
    "Na WKIRy",
    "Na WKIR[y]",
    "Ukrainian body cosmetics",
    "professional skin care",
  ],
};

/** Root slugs that belong to the skin line. Everything else is hair. */
const SKIN_ROOTS = new Set(["skin-care"]);

/**
 * @param rootSlug slug of the top-level category — for a subcategory that is its
 * parent's slug, for a top-level category its own.
 */
export function getBrandLine(rootSlug: string): BrandLine {
  return SKIN_ROOTS.has(rootSlug) ? SKIN : HAIR;
}

export function isSkinLine(rootSlug: string): boolean {
  return SKIN_ROOTS.has(rootSlug);
}
