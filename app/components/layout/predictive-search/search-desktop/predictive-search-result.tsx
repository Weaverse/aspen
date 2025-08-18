import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { CompareAtPrice } from "~/components/product/variant-prices";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { RevealUnderline } from "~/reveal-underline";
import type {
  NormalizedPredictiveSearchResultItem,
  NormalizedPredictiveSearchResults,
} from "~/types/predictive-search";
import { isDiscounted } from "~/utils/product";

type SearchResultTypeProps = {
  items?: NormalizedPredictiveSearchResultItem[];
  type: NormalizedPredictiveSearchResults[number]["type"];
};

export function PredictiveSearchResult({ items, type }: SearchResultTypeProps) {
  let isSuggestions = type === "queries";

  return (
    <div key={type} className="predictive-search-result flex flex-col gap-4">
      {isSuggestions && (
        <span className="uppercase border-b border-line-subtle py-1 px-3 font-normal">
          {isSuggestions && "Suggestions"}
        </span>
      )}
      {items?.length ? (
        <ul
          className={clsx(
            type === "queries" && "space-y-1",
            type === "articles" && "space-y-3",
            type === "products" && "flex gap-4"
          )}
        >
          {items.map((item: NormalizedPredictiveSearchResultItem) => (
            <SearchResultItem item={item} key={item.id} />
          ))}
        </ul>
      ) : (
        <div className="text-body-subtle">
          No {isSuggestions ? "suggestions" : type} available.
        </div>
      )}
    </div>
  );
}

type SearchResultItemProps = {
  item: NormalizedPredictiveSearchResultItem;
};

function SearchResultItem({
  item: {
    id,
    __typename,
    image,
    compareAtPrice,
    price,
    title,
    url,
    styledTitle,
  },
}: SearchResultItemProps) {
  return (
    <li key={id}>
      <Link
        className="flex flex-col gap-4"
        to={
          __typename === "SearchQuerySuggestion" || !url
            ? `/search?q=${id}`
            : url
        }
        data-type={__typename}
      >
        {__typename === "Product" && (
          <div className="shrink-0">
            {image?.url && (
              <Image
                alt={image.altText ?? ""}
                src={image.url}
                className="max-w-full"
                aspectRatio="1/1"
              />
            )}
          </div>
        )}
        <div className="space-y-1">
          {styledTitle ? (
            <RevealUnderline as="div">
              <span dangerouslySetInnerHTML={{ __html: styledTitle }} />
            </RevealUnderline>
          ) : (
            <div
              className={clsx(
                __typename === "Product" ? "line-clamp-1" : "line-clamp-2"
              )}
            >
              <span className={clsx(__typename === "Product" ? "font-semibold uppercase line-clamp-1" : "font-normal")}>{title}</span>
            </div>
          )}
          {price && (
            <div className="flex gap-2 pt-1">
              <Money withoutTrailingZeros data={price as MoneyV2} />
              {isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2) && (
                <CompareAtPrice data={compareAtPrice as MoneyV2} />
              )}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
