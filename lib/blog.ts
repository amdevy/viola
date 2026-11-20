import { createPublicClient } from "@/lib/supabase/server";
import { localize, BLOG_I18N_FIELDS } from "@/lib/i18n/localize";

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string;
  reading_time: number | null;
}

/** One published post, raw (not localized). Null for a draft or an unknown slug. */
export async function getPublishedPost(slug: string) {
  try {
    const supabase = createPublicClient();
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

/** Every published post, newest first, localized — the /blog listing. */
export async function getPublishedPosts(locale: string): Promise<BlogPostSummary[]> {
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
      return row as unknown as BlogPostSummary;
    });
  } catch {
    return [];
  }
}
