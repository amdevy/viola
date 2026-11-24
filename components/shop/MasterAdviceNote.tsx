/**
 * «Перед покупкою рекомендуємо отримати рекомендацію кваліфікованого майстра».
 *
 * The Na Gólov[y] brand requires this line on every site that sells its
 * cosmetics (brand rules for salon sites, rule 6). It sits next to the buy
 * buttons: under «Додати до кошика» on the product page and above
 * «Оформити замовлення» in the cart. Plain text, no hooks, so server and
 * client components can both render it; the caller passes the translated line.
 */
export default function MasterAdviceNote({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <p
      data-testid="master-advice"
      className={`flex items-start gap-2 text-xs leading-relaxed text-muted ${className}`}
    >
      <svg
        className="mt-px h-4 w-4 shrink-0 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
      <span>{text}</span>
    </p>
  );
}
