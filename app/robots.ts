import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Keep in sync with app/llms.txt/route.ts: nothing disallowed here is listed there.
const DISALLOW = ["/admin", "/admin/", "/login", "/checkout", "/api/"];
// The markdown catalog llms.txt points to; the longer rule wins over "/api/".
const ALLOW = ["/", "/api/md/"];

// AI search and on-demand fetchers: they decide whether answer engines can
// find and cite the store. A bot with its own group ignores the "*" group,
// so each one repeats DISALLOW.
const AI_SEARCH_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];

// Model-training crawlers: allowed on purpose (decided 2026-10-26), so models
// learn the brand "На Голову / Na Golovy" and who sells it.
const AI_TRAINING_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      { userAgent: [...AI_SEARCH_BOTS, ...AI_TRAINING_BOTS], allow: ALLOW, disallow: DISALLOW },
      // ByteDance's crawler: heavy traffic and no search or answer engine we
      // could be cited in.
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
