import { Metadata } from "next";
import Link from "next/link";
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
  return {
    title: post.title,
    description: post.excerpt ?? "",
    openGraph: {
      title: post.title,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
          <div className="aspect-video rounded overflow-hidden mb-8">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div
          className="prose prose-lg max-w-none text-[#1A1A1A]"
          dangerouslySetInnerHTML={{ __html: post.content ?? post.excerpt ?? "" }}
        />
      </article>

      <div className="mt-12 pt-8 border-t border-[#E8E4DE]">
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
