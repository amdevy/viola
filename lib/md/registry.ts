import { getTranslations } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/server";
import { getCategoryTree } from "@/lib/categories-server";
import { flattenCategoryTree } from "@/lib/categories";
import { getNaGolovyContent } from "@/lib/na-golovy-content";
import {
  hasEnTranslation,
  localize,
  BLOG_I18N_FIELDS,
  PRODUCT_I18N_FIELDS,
  CATEGORY_I18N_FIELDS,
} from "@/lib/i18n/localize";
import { formatPrice, formatVolume } from "@/lib/utils";
import { matchMdPattern, type MdLocale, type MdPattern } from "@/lib/md/routes";
import {
  renderAbout,
  renderContacts,
  renderDelivery,
  renderHome,
  renderNaGolovy,
  renderPoslugy,
} from "@/lib/md/renderers/static";
import { renderCategory, renderProduct, renderShop } from "@/lib/md/renderers/shop";
import { renderBlogIndex, renderBlogPost } from "@/lib/md/renderers/blog";

type Render = (params: Record<string, string>, locale: MdLocale) => Promise<string | null>;

/** Every pattern in lib/md/routes.ts must have a renderer — the type enforces it. */
const RENDERERS: Record<MdPattern, Render> = {
  "/": (_, locale) => renderHome(locale),
  "/shop": (_, locale) => renderShop(locale),
  "/shop/category/[slug]": ({ slug }, locale) => renderCategory(slug, locale),
  "/shop/[slug]": ({ slug }, locale) => renderProduct(slug, locale),
  "/na-golovy": (_, locale) => renderNaGolovy(locale),
  "/about": (_, locale) => renderAbout(locale),
  "/poslugy": (_, locale) => renderPoslugy(locale),
  "/delivery": (_, locale) => renderDelivery(locale),
  "/contacts": (_, locale) => renderContacts(locale),
  "/blog": (_, locale) => renderBlogIndex(locale),
  "/blog/[slug]": ({ slug }, locale) => renderBlogPost(slug, locale),
};

/** Markdown for a path such as "/shop/x" ("/" or "/index" is the homepage); null = 404. */
export async function renderMarkdown(path: string, locale: MdLocale): Promise<string | null> {
  const match = matchMdPattern(path);
  if (!match) return null;
  return RENDERERS[match.pattern](match.params, locale);
}

export type MdSection = "core" | "categories" | "products" | "blog";

export interface MdRouteEntry {
  path: string;
  section: MdSection;
  title: string;
  /** One factual line for llms.txt. */
  description: string;
}

/**
 * Every addressable markdown page in a locale, in llms.txt order. Lists the
 * same pages the sitemap does: products in stock, published posts, non-empty
 * categories; on /en only the products and posts that are fully translated.
 */
export async function listMarkdownRoutes(locale: MdLocale): Promise<MdRouteEntry[]> {
  const meta = await getTranslations({ locale, namespace: "meta" });
  const isEn = locale === "en";
  const supabase = createPublicClient();

  const [{ data: products }, { data: posts }, categories] = await Promise.all([
    supabase
      .from("products")
      .select(
        "slug, price, volume, name, name_en, description, description_en, ingredients, ingredients_en, how_to_use, how_to_use_en, benefits, benefits_en, category:categories(name, name_en)",
      )
      .eq("in_stock", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("blog_posts")
      .select("slug, title, title_en, excerpt, excerpt_en, content, content_en")
      .eq("published", true)
      .order("published_at", { ascending: false }),
    getCategoryTree(locale),
  ]);

  const core: MdRouteEntry[] = [
    { path: "/", title: meta("homeTitle"), description: meta("homeDescription") },
    { path: "/na-golovy", title: getNaGolovyContent(locale).h1, description: isEn ? "The brand: philosophy, product lines, FAQ, where to buy." : "Бренд: філософія, лінійки, FAQ, де купити." },
    { path: "/shop", title: meta("shopTitle"), description: meta("shopDescription") },
    { path: "/about", title: meta("aboutTitle"), description: meta("aboutDescription") },
    { path: "/poslugy", title: meta("poslugyTitle"), description: meta("poslugyDescription") },
    { path: "/delivery", title: meta("deliveryTitle"), description: meta("deliveryDescription") },
    { path: "/contacts", title: meta("contactsTitle"), description: meta("contactsDescription") },
    { path: "/blog", title: meta("blogTitle"), description: meta("blogDescription") },
  ].map((e) => ({ ...e, section: "core" as const }));

  const categoryEntries: MdRouteEntry[] = flattenCategoryTree(categories).map((c) => ({
    path: `/shop/category/${c.slug}`,
    section: "categories",
    title: c.name,
    description: isEn ? `Na Golovy ${c.name.toLowerCase()}: products and buying guide.` : `${c.name} Na Golovy: товари та поради з вибору.`,
  }));

  const productEntries: MdRouteEntry[] = (products ?? [])
    .filter((p) => !isEn || hasEnTranslation(p as unknown as Record<string, unknown>, PRODUCT_I18N_FIELDS))
    .map((p) => {
      const { row } = localize(p as unknown as Record<string, unknown>, locale, PRODUCT_I18N_FIELDS);
      const rawCategory = (p as unknown as { category: Record<string, unknown> | null }).category;
      const category = rawCategory ? (localize(rawCategory, locale, CATEGORY_I18N_FIELDS).row.name as string) : null;
      const facts = [category, formatPrice(p.price, locale), formatVolume(p.volume, locale)].filter(Boolean);
      return {
        path: `/shop/${p.slug}`,
        section: "products" as const,
        title: (row.name as string).replace(/\s+/g, " ").trim(),
        description: facts.join(", "),
      };
    });

  const blogEntries: MdRouteEntry[] = (posts ?? [])
    .filter((p) => !isEn || hasEnTranslation(p as Record<string, unknown>, BLOG_I18N_FIELDS))
    .map((p) => {
      const { row } = localize(p as Record<string, unknown>, locale, BLOG_I18N_FIELDS);
      return {
        path: `/blog/${p.slug}`,
        section: "blog" as const,
        title: row.title as string,
        description: (row.excerpt as string | null) ?? "",
      };
    });

  return [...core, ...categoryEntries, ...productEntries, ...blogEntries];
}
