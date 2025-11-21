import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { CompareAtPrice } from "~/components/product/variant-prices";
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
        <span className="border-line-subtle border-b px-3 py-1 font-normal uppercase">
          {isSuggestions && "Suggestions"}
        </span>
      )}
      {items?.length ? (
        <ul
          className={clsx(
            type === "queries" && "space-y-1",
            type === "articles" && "space-y-3",
            type === "products" && "flex gap-4",
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
    <li
      key={id}
      className={clsx(
        __typename === "Product" && "min-w-0 flex-[0_0_calc(25%-12px)]",
      )}
    >
      <Link
        className="flex flex-col gap-5"
        to={
          __typename === "SearchQuerySuggestion" || !url
            ? `/search?q=${id}`
            : url
        }
        data-type={__typename}
      >
        {__typename === "Product" && (
          <div className="aspect-square w-full shrink-0">
            {image?.url && (
              <Image
                alt={image.altText ?? ""}
                src={image.url}
                aspectRatio="1/1"
              />
            )}
          </div>
        )}
        <div className="flex flex-col gap-1">
          {styledTitle ? (
            <RevealUnderline as="div" className="ff-heading w-fit">
              <span dangerouslySetInnerHTML={{ __html: styledTitle }} />
            </RevealUnderline>
          ) : (
            <div
              className={clsx(
                __typename === "Product" ? "line-clamp-1" : "line-clamp-2",
              )}
            >
              <RevealUnderline
                className={clsx(
                  "ff-heading",
                  __typename === "Product"
                    ? "line-clamp-1 font-semibold uppercase"
                    : "font-normal",
                )}
              >
                {title}
              </RevealUnderline>
            </div>
          )}
          {price && (
            <div className="flex gap-2">
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
