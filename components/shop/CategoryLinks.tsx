import { Link } from "@/i18n/routing";

export type CategoryLinkItem = {
  slug: string;
  /** Category and brand together: "Шампуні На Голову". */
  label: string;
  /** "19 товарів · від 900 грн"; omitted when the products failed to load. */
  meta?: string | null;
};

/**
 * Links from the catalogue to the category pages, in the server HTML.
 *
 * /shop lists every product, and its only way to a category was the sidebar
 * filter — `<button>`s that re-query in place. So the catalogue passed nothing
 * on to the category pages, and from late October 2026 Google began showing
 * /shop itself for "на голову шампунь" and "на голову маска" next to the
 * category page (two URLs of one site taking turns at position 9). These are
 * the links that say which page is the one about shampoos.
 *
 * A server component on purpose: it is passed into the client ShopContent as a
 * prop, so it renders once on the server and ships as plain `<a>`s.
 */
export default function CategoryLinks({
  heading,
  items,
}: {
  heading: string;
  items: CategoryLinkItem[];
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={heading} className="mb-5 md:mb-8">
      <h2 className="text-xs uppercase tracking-widest text-[#6B6B6B] mb-3">{heading}</h2>
      {/* One swipeable row on phones, so the product grid stays near the top.
          Each card there is as wide as its name, kept to one line, so the row
          is no taller than the name plus the meta line. The scrollbar is
          hidden: the site's wide gold one sat under the cards like a progress
          bar, and the cut-off card already says "swipe". */}
      <ul className="flex gap-3 overflow-x-auto -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
        {items.map((item) => (
          <li key={item.slug} className="shrink-0 w-auto">
            <Link
              href={`/shop/category/${item.slug}`}
              className="group block h-full rounded border border-[#E8E4DE] bg-white px-4 py-2.5 sm:py-3 transition-colors hover:border-[#C4A882] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A882]"
            >
              <span className="block whitespace-nowrap text-sm font-medium text-[#1A1A1A] transition-colors group-hover:text-[#C4A882] sm:whitespace-normal">
                {item.label}
              </span>
              {item.meta && (
                <span className="mt-1 block text-xs text-[#6B6B6B]">{item.meta}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
