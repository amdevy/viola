import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/server";
import { localize, BLOG_I18N_FIELDS } from "@/lib/i18n/localize";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/blog`;
  const enUrl = `${siteUrl}/en/blog`;

  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
    keywords: ["Na Golovy blog", "na golovy hair care", "Na Golovy tips"],
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
  };
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string;
  reading_time: number | null;
}

async function getPosts(locale: string): Promise<BlogPost[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("blog_posts")
      .select(
        "id,title,title_en,slug,excerpt,excerpt_en,cover_image,published_at,reading_time"
      )
      .eq("published", true)
      .order("published_at", { ascending: false });
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    return rows.map((r) => {
      const { row } = localize(r, locale, BLOG_I18N_FIELDS);
      return row as unknown as BlogPost;
    });
  } catch {
    return [];
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const posts = await getPosts(locale);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-3">{t("title")}</h1>
        <p className="text-[#6B6B6B] max-w-xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-[#6B6B6B] py-16">{tc("noArticles")}</p>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <article key={post.id} className="group">
            <Link href={`/blog/${post.slug}`}>
              <div className="relative aspect-video rounded overflow-hidden bg-gradient-to-br from-[#E8E4DE] to-[#D4C5B0] mb-4 group-hover:opacity-90 transition-opacity">
                {post.cover_image && (
                  <Image
                    src={post.cover_image}
                    alt={
                      locale === "en"
                        ? `${post.title} — Viola Hehedosh blog, Na Gólov[y] hair care`
                        : `${post.title} — блог Віоли Гегедош про догляд Na Gólov[y]`
                    }
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 text-xs text-[#6B6B6B] mb-2">
                  <time dateTime={post.published_at}>
                    {new Date(post.published_at).toLocaleDateString(locale === "en" ? "en-US" : "uk-UA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  {post.reading_time && (
                    <>
                      <span>·</span>
                      <span>{tc("minReading", { min: post.reading_time })}</span>
                    </>
                  )}
                </div>
                <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-2 group-hover:text-[#C4A882] transition-colors line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-[#6B6B6B] line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-[#C4A882] mt-3 font-medium">
                  {tc("readMore")}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
      )}
    </div>
  );
}
