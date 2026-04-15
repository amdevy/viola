import type { Metadata } from "next";
import type React from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localize, BLOG_I18N_FIELDS } from "@/lib/i18n/localize";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

async function getPost(slug: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const raw = await getPost(slug);
  if (!raw) return { title: locale === "en" ? "Article not found" : "Стаття не знайдена" };

  const { row: post, hasTranslation } = localize(
    raw as Record<string, unknown>,
    locale,
    BLOG_I18N_FIELDS,
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/blog/${slug}`;
  const enUrl = `${siteUrl}/en/blog/${slug}`;

  const shouldNoindex = locale === "en" && !hasTranslation;

  return {
    title: post.title as string,
    description: (post.excerpt as string | null) ?? "",
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: {
        uk: ukUrl,
        ...(hasTranslation ? { en: enUrl } : {}),
        "x-default": ukUrl,
      },
    },
    robots: shouldNoindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: post.title as string,
      locale: locale === "en" ? "en_US" : "uk_UA",
      images: post.cover_image ? [{ url: post.cover_image as string }] : [],
    },
  };
}

function renderContent(content: string) {
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  if (hasHtml) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const paragraphs = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-5 text-[#1A1A1A] leading-relaxed text-base">
      {paragraphs.map((para, i) => {
        const lines = para.split(/\n/).filter(Boolean);

        const elements: React.ReactNode[] = [];
        const bulletItems: string[] = [];

        for (const line of lines) {
          if (line.trim().startsWith("•")) {
            bulletItems.push(line.replace(/^•\s*/, ""));
          } else if ((line.match(/•/g) ?? []).length >= 2) {
            const parts = line.split(/\s*•\s*/).filter(Boolean);
            const intro = parts[0].endsWith("?") || parts[0].endsWith(":") || parts.length > 2
              ? parts[0]
              : null;
            const items = intro ? parts.slice(1) : parts;
            if (intro) elements.push(<p key={`intro-${i}`}>{intro}</p>);
            items.forEach((item) => bulletItems.push(item));
          } else {
            elements.push(<p key={`p-${i}-${line.slice(0, 10)}`}>{line}</p>);
          }
        }

        return (
          <div key={i} className="space-y-2">
            {elements}
            {bulletItems.length > 0 && (
              <ul className="space-y-1.5 my-2">
                {bulletItems.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="text-[#C4A882] shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "blogPost" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const raw = await getPost(slug);
  if (!raw) notFound();

  const { row: post } = localize(
    raw as unknown as Record<string, unknown>,
    locale,
    BLOG_I18N_FIELDS,
  ) as unknown as { row: { title: string; excerpt: string | null; content: string | null; cover_image: string | null; published_at: string; updated_at?: string; reading_time: number | null } };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("home"), item: locale === "en" ? `${siteUrl}/en` : siteUrl },
      { "@type": "ListItem", position: 2, name: t("blog"), item: locale === "en" ? `${siteUrl}/en/blog` : `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? "",
    ...(post.cover_image && { image: post.cover_image }),
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    inLanguage: locale === "en" ? "en-US" : "uk-UA",
    author: {
      "@type": "Person",
      "@id": "https://violamukachevo.com/#viola",
      name: locale === "en" ? "Viola Hehedosh" : "Віола Гегедош",
      url: locale === "en" ? `${siteUrl}/en/about` : `${siteUrl}/about`,
      jobTitle: locale === "en" ? "Na Gólov[y] Brand Technologist" : "Технолог бренду Na Gólov[y]",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://violamukachevo.com/#business",
      name: locale === "en" ? "Viola Beauty Salon" : "Салон краси Viola",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/preview.jpg` },
    },
    url: locale === "en" ? `${siteUrl}/en/blog/${slug}` : `${siteUrl}/blog/${slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": locale === "en" ? `${siteUrl}/en/blog/${slug}` : `${siteUrl}/blog/${slug}` },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <nav className="text-xs text-[#6B6B6B] mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[#C4A882]">{t("blog")}</Link>
        <span>/</span>
        <span className="text-[#1A1A1A]">{post.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <p className="text-[#C4A882] text-xs uppercase tracking-widest mb-3">{t("blog")}</p>
          <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-[#6B6B6B]">
            <Link href="/about" className="font-medium text-[#1A1A1A] hover:text-[#C4A882] transition-colors">
              {t("authorName")}
            </Link>
            <span>·</span>
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
        </header>

        {post.cover_image && (
          <div className="relative aspect-video rounded overflow-hidden mb-8">
            <Image
              src={post.cover_image}
              alt={
                locale === "en"
                  ? `${post.title} — Viola Hehedosh blog, Na Gólov[y] hair care`
                  : `${post.title} — блог Віоли Гегедош про догляд Na Gólov[y]`
              }
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
              priority
            />
          </div>
        )}

        {renderContent(post.content ?? post.excerpt ?? "")}
      </article>

      {/* Author card */}
      <div className="mt-12 pt-8 border-t border-[#E8E4DE]">
        <Link href="/about" className="flex items-center gap-4 group">
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src="/viola.JPG"
              alt={t("authorName")}
              fill
              sizes="48px"
              className="object-cover object-[center_15%]"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C4A882] transition-colors">
              {t("authorName")}
            </p>
            <p className="text-xs text-[#6B6B6B]">
              {t("authorRole")}
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-8 pt-8 border-t border-[#E8E4DE]">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-[#C4A882] hover:text-[#A8875E] font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("allArticles")}
        </Link>
      </div>
    </div>
  );
}
