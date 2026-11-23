import { parseProductText } from "@/lib/product-text";

/**
 * Lays out a product's description / ingredients / how-to-use text: steps as a
 * numbered list, «•» lines as a list with the key term in bold, subheadings,
 * and the INCI list in small type. Plain paragraphs otherwise.
 *
 * No hooks, so it renders on the server and the whole text is in the HTML.
 */
export default function ProductText({ text }: { text: string | null | undefined }) {
  const blocks = parseProductText(text);
  if (blocks.length === 0) return null;

  return (
    <div className="max-w-3xl space-y-3 text-[15px] leading-relaxed text-[#1A1A1A]/80">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h3
                key={i}
                className="pt-3 first:pt-0 text-sm font-semibold uppercase tracking-wide text-[#1A1A1A]"
              >
                {block.text}
              </h3>
            );
          case "labeled":
            return (
              <p key={i}>
                <span className="font-semibold text-[#1A1A1A]">{block.label}:</span> {block.text}
              </p>
            );
          case "steps":
            return (
              <ol key={i} className="space-y-3">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F0EDE8] text-xs font-semibold text-[#1A1A1A]"
                    >
                      {item.n}
                    </span>
                    <span>
                      <span className="sr-only">{item.n}. </span>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "list":
            return (
              <ul key={i} className="space-y-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-[0.6em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#C4A882]"
                    />
                    <span>
                      {item.term && (
                        <>
                          <span className="font-semibold text-[#1A1A1A]">{item.term}</span>
                          {item.inci && <span className="text-[#6B6B6B]"> ({item.inci})</span>}
                          {" — "}
                        </>
                      )}
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "inci":
            return (
              <p
                key={i}
                className="rounded bg-[#F0EDE8]/60 px-4 py-3 text-xs leading-relaxed text-[#6B6B6B]"
              >
                {block.text}
              </p>
            );
          default:
            return <p key={i}>{block.text}</p>;
        }
      })}
    </div>
  );
}
