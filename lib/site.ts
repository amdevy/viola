/**
 * Facts about the store that more than one place states: the layout's JSON-LD,
 * /llms.txt and the markdown versions of pages (lib/md). Keep them here so a new
 * phone number or Instagram handle changes everywhere at once.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

export const SITE = {
  name: "Viola",
  phone: "+380500582175",
  phoneDisplay: "+380 50 058 21 75",
  email: "hello@viola.com.ua",
  instagram: "https://www.instagram.com/viola.mukachevo",
  telegram: "https://t.me/violagegedosh",
  brandUrl: "https://www.nagolovy.pro/",
} as const;

export const SAME_AS = [SITE.instagram, SITE.telegram];
