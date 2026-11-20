import { getTranslations } from "next-intl/server";
import { getPublishedPost, getPublishedPosts } from "@/lib/blog";
import { localize, BLOG_I18N_FIELDS } from "@/lib/i18n/localize";
import { blogTextToMarkdown, htmlUrl, isoDate, link, list, renderMdPage } from "@/lib/md/format";
import type { MdLocale } from "@/lib/md/routes";

export async function renderBlogIndex(locale: MdLocale): Promise<string> {
  const [t, meta, tc] = await Promise.all([
    getTranslations({ locale, namespace: "blog" }),
    getTranslations({ locale, namespace: "meta" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  const posts = await getPublishedPosts(locale);

  const body = posts.length
    ? list(
        posts.map((p) => {
          const date = isoDate(p.published_at);
          return `${link(p.title, htmlUrl(`/blog/${p.slug}`, locale))}${date ? ` (${date})` : ""}${p.excerpt ? ` — ${p.excerpt}` : ""}`;
        }),
      )
    : tc("noArticles");

  return renderMdPage(
    {
      title: t("title"),
      summary: meta("blogDescription"),
      canonical: htmlUrl("/blog", locale),
      updated: isoDate(posts[0]?.published_at),
      body: `${t("subtitle")}\n\n${body}`,
    },
    locale,
  );
}

/**
 * /blog/[slug]. Null for a draft or unknown slug, and on /en when the post is
 * not fully translated: that HTML page is noindex, so it gets no markdown.
 */
export async function renderBlogPost(slug: string, locale: MdLocale): Promise<string | null> {
  const raw = await getPublishedPost(slug);
  if (!raw) return null;

  const { row, hasTranslation } = localize(raw as Record<string, unknown>, locale, BLOG_I18N_FIELDS);
  if (locale === "en" && !hasTranslation) return null;
  const post = row as unknown as {
    title: string;
    excerpt: string | null;
    content: string | null;
    published_at: string;
    updated_at?: string | null;
    reading_time: number | null;
  };

  const [t, tc] = await Promise.all([
    getTranslations({ locale, namespace: "blogPost" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  const published = isoDate(post.published_at);
  const byline = [
    link(t("authorName"), htmlUrl("/about", locale)),
    t("authorRole"),
    published,
    post.reading_time ? tc("minReading", { min: post.reading_time }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return renderMdPage(
    {
      title: post.title,
      summary: post.excerpt ?? post.title,
      canonical: htmlUrl(`/blog/${slug}`, locale),
      updated: isoDate(post.updated_at) ?? published,
      body: `${byline}\n\n${blogTextToMarkdown(post.content ?? post.excerpt ?? "")}`,
      related: [
        { text: t("relatedBrand"), url: htmlUrl("/na-golovy", locale) },
        { text: t("relatedShop"), url: htmlUrl("/shop", locale) },
        { text: t("relatedShampoos"), url: htmlUrl("/shop/category/shampoos", locale) },
        { text: t("allArticles"), url: htmlUrl("/blog", locale) },
      ],
    },
    locale,
  );
}
