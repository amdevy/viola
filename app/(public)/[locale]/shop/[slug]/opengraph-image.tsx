import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/server";
import { localize, PRODUCT_I18N_FIELDS } from "@/lib/i18n/localize";

export const runtime = "edge";
export const alt = "Na Gólov[y] product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("name, name_en, price, images")
    .eq("slug", params.slug)
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

  const { row: product } = localize(
    data as unknown as Record<string, unknown>,
    params.locale,
    PRODUCT_I18N_FIELDS,
  ) as unknown as { row: { name: string; price: number; images: string[] } };

  const productImage = product.images?.[0];
  const priceLabel = params.locale === "en" ? `${product.price} UAH` : `${product.price} грн`;
  const ctaLabel = params.locale === "en" ? "Buy Na Gólov[y]" : "Купити Na Gólov[y]";

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
        {productImage && (
          <div
            style={{
              width: "45%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#E8E4DE",
            }}
          >
            {}
            <img
              src={productImage}
              alt=""
              style={{ width: "85%", height: "85%", objectFit: "contain" }}
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
              fontSize: 20,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#C4A882",
              marginBottom: 24,
            }}
          >
            Na Gólov[y] · Viola
          </div>
          <div
            style={{
              fontSize: 56,
              lineHeight: 1.1,
              fontWeight: 700,
              color: "#1A1A1A",
              marginBottom: 32,
              display: "flex",
            }}
          >
            {product.name}
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#1A1A1A", marginBottom: 24 }}>
            {priceLabel}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#6B6B6B",
              borderTop: "2px solid #E8E4DE",
              paddingTop: 20,
            }}
          >
            {ctaLabel}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
