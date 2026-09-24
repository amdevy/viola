import { getTranslations } from "next-intl/server";

export default async function ProductTrustBadges({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "product" });

  const items = [
    {
      title: t("trustDeliveryTitle"),
      desc: t("trustDeliveryDesc"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h13v8H3v-8zm13 0V6a2 2 0 012-2h1l3 4v6h-4M7 18a2 2 0 11-4 0M19 18a2 2 0 11-4 0" />
        </svg>
      ),
    },
    {
      title: t("trustShippingTitle"),
      desc: t("trustShippingDesc"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      // Not "14-day returns": the public offer says cosmetics can't be returned.
      // What a buyer can do is inspect the parcel and refuse a damaged one.
      title: t("trustInspectTitle"),
      desc: t("trustInspectDesc"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      ),
    },
    {
      title: t("trustOriginalTitle"),
      desc: t("trustOriginalDesc"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-6 pt-6 border-t border-[#E8E4DE] grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.title} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 sm:text-center">
          <div className="text-[#C4A882] flex-shrink-0">{item.icon}</div>
          <div>
            <p className="text-xs font-semibold text-[#1A1A1A] leading-tight">{item.title}</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5 leading-tight">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
