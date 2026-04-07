import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Стаття не знайдена" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  return {
    title: post.title,
    description: post.excerpt ?? "",
    alternates: { canonical: `${siteUrl}/blog/${slug}` },
    openGraph: {
      title: post.title,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
  };
}

function renderContent(content: string) {
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  if (hasHtml) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  // Split into paragraphs on double newlines
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-5 text-[#1A1A1A] leading-relaxed text-base">
      {paragraphs.map((para, i) => {
        const lines = para.split(/\n/).filter(Boolean);

        // Each line: if it has 2+ inline "• " bullets, split on them
        const elements: React.ReactNode[] = [];
        const bulletItems: string[] = [];

        for (const line of lines) {
          if (line.trim().startsWith("•")) {
            bulletItems.push(line.replace(/^•\s*/, ""));
          } else if ((line.match(/•/g) ?? []).length >= 2) {
            // Inline bullets — split on "• "
            const parts = line.split(/\s*•\s*/).filter(Boolean);
            // First part is likely intro text
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
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Блог", item: `${siteUrl}/blog` },
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
    author: {
      "@type": "Person",
      "@id": "https://violamukachevo.com/#viola",
      name: "Віола Гегедош",
      url: `${siteUrl}/about`,
      jobTitle: "Технолог бренду Na Gólov[y]",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://violamukachevo.com/#business",
      name: "Салон краси Viola",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/preview.jpg` },
    },
    url: `${siteUrl}/blog/${slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/blog/${slug}` },
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
        <Link href="/" className="hover:text-[#C4A882]">Головна</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[#C4A882]">Блог</Link>
        <span>/</span>
        <span className="text-[#1A1A1A]">{post.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <p className="text-[#C4A882] text-xs uppercase tracking-widest mb-3">Блог</p>
          <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-[#6B6B6B]">
            <Link href="/about" className="font-medium text-[#1A1A1A] hover:text-[#C4A882] transition-colors">
              Віола Гегедош
            </Link>
            <span>·</span>
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString("uk-UA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
            {post.reading_time && (
              <>
                <span>·</span>
                <span>{post.reading_time} хв читання</span>
              </>
            )}
          </div>
        </header>

        {post.cover_image && (
          <div className="relative aspect-video rounded overflow-hidden mb-8">
            <Image
              src={post.cover_image}
              alt={post.title}
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
          <img
            src="/viola.JPG"
            alt="Віола Гегедош"
            className="w-12 h-12 rounded-full object-cover object-[center_15%]"
          />
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C4A882] transition-colors">
              Віола Гегедош
            </p>
            <p className="text-xs text-[#6B6B6B]">
              Технолог бренду Na Golov[y] · Засновниця салону Viola
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
          Усі статті
        </Link>
      </div>
    </div>
  );
}
