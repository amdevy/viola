import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Блог — Поради по догляду за волоссям від Viola",
  description: "Корисні статті та поради від Віола Гегедош, Експерта бренду Na Golovy (На Голову), про догляд за волоссям та використання косметики Na Golovy.",
  keywords: ["Na Golovy блог", "na golovy поради", "на голову догляд", "догляд за волоссям Na Golovy"],
  alternates: { canonical: "https://violamukachevo.com/blog" },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string;
  reading_time: number | null;
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,cover_image,published_at,reading_time")
      .eq("published", true)
      .order("published_at", { ascending: false });
    return (data as BlogPost[]) ?? [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-3">Блог</h1>
        <p className="text-[#6B6B6B] max-w-xl mx-auto">
          Поради від Експерта бренду Na Golovy про догляд за волоссям
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-[#6B6B6B] py-16">Статей поки немає</p>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <article key={post.id} className="group">
            <Link href={`/blog/${post.slug}`}>
              <div className="aspect-video rounded overflow-hidden bg-gradient-to-br from-[#E8E4DE] to-[#D4C5B0] mb-4 group-hover:opacity-90 transition-opacity">
                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 text-xs text-[#6B6B6B] mb-2">
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
                <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-2 group-hover:text-[#C4A882] transition-colors line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-[#6B6B6B] line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-[#C4A882] mt-3 font-medium">
                  Читати далі
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
