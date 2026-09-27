import { normalizeSearchStyledText } from "~/utils/search-highlight";

export function SuggestionTitle({
  title,
  styledTitle,
}: {
  title: string;
  styledTitle?: string;
}) {
  if (!styledTitle) {
    return title;
  }

  return (
    <span
      className="search-suggestion-highlight font-normal [&_b]:font-semibold [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-inherit"
      // Shopify returns only emphasis markup. Mark tags are normalized to <b>
      // so matches render bold instead of the browser yellow highlight.
      dangerouslySetInnerHTML={{
        __html: normalizeSearchStyledText(styledTitle),
      }}
    />
  );
}
