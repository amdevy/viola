import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/server";
import { localize, BLOG_I18N_FIELDS } from "@/lib/i18n/localize";

export const runtime = "edge";
export const alt = "Na Gólov[y] blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, title_en, excerpt, excerpt_en, cover_image")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FAFAF8",
            fontSize: 48,
            color: "#1A1A1A",
          }}
        >
          Na Gólov[y]
        </div>
      ),
      size,
    );
  }

  const { row: post } = localize(
    data as unknown as Record<string, unknown>,
    params.locale,
    BLOG_I18N_FIELDS,
  ) as unknown as { row: { title: string; excerpt: string | null; cover_image: string | null } };

  const label = params.locale === "en" ? "BLOG · Na Gólov[y]" : "БЛОГ · Na Gólov[y]";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FAFAF8",
          fontFamily: "sans-serif",
        }}
      >
        {post.cover_image && (
          <div
            style={{
              width: "40%",
              height: "100%",
              display: "flex",
            }}
          >
            {}
            <img
              src={post.cover_image}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 60px 60px 50px",
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.3em",
              color: "#C4A882",
              marginBottom: 28,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 48,
              lineHeight: 1.15,
              fontWeight: 700,
              color: "#1A1A1A",
              marginBottom: 28,
              display: "flex",
            }}
          >
            {post.title}
          </div>
          {post.excerpt && (
            <div
              style={{
                fontSize: 22,
                lineHeight: 1.4,
                color: "#6B6B6B",
                display: "flex",
              }}
            >
              {post.excerpt.slice(0, 140)}
              {post.excerpt.length > 140 ? "…" : ""}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
