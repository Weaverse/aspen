import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { useRef } from "react";
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
  const isSuggestions = type === "queries";
  const scrollRef = useRef<HTMLUListElement>(null);
  const isDragging = useRef(false);

  // Drag scrolling functionality for queries
  const handleMouseDown = (e: React.MouseEvent) => {
    if (type !== "queries" || !scrollRef.current) return;

    e.preventDefault();
    const slider = scrollRef.current;
    const startX = e.pageX;
    const scrollLeft = slider.scrollLeft;
    isDragging.current = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollRef.current) return;

      e.preventDefault();
      isDragging.current = true;

      const x = e.pageX;
      const walk = (x - startX) * 1.5; // Adjust scroll speed
      scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseUp);

      if (scrollRef.current) {
        scrollRef.current.style.cursor = "grab";
      }

      // Reset dragging state after a brief delay
      setTimeout(() => {
        isDragging.current = false;
      }, 100);
    };

    const handleMouseLeave = () => {
      handleMouseUp();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);

    slider.style.cursor = "grabbing";
  };

  return (
    <div key={type} className="predictive-search-result flex flex-col gap-4">
      {isSuggestions && (
        <span className="border-line-subtle border-b pb-3 font-normal uppercase">
          {isSuggestions && "Suggestions"}
        </span>
      )}
      {items?.length ? (
        <ul
          ref={scrollRef}
          className={clsx(
            type === "queries" &&
              "scrollbar-hide drag-scroll flex cursor-grab select-none gap-3 overflow-x-auto pb-2",
            type === "articles" && "space-y-3",
            type === "products" && "space-y-4",
          )}
          onMouseDown={handleMouseDown}
          style={{
            userSelect: type === "queries" ? "none" : "auto",
            WebkitUserSelect: type === "queries" ? "none" : "auto",
            msUserSelect: type === "queries" ? "none" : "auto",
          }}
        >
          {items.map((item: NormalizedPredictiveSearchResultItem) => (
            <SearchResultItem
              item={item}
              key={item.id}
              type={type}
              isDragging={isDragging}
            />
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
  type: NormalizedPredictiveSearchResults[number]["type"];
  isDragging?: React.MutableRefObject<boolean>;
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
    // vendor,
    styledTitle,
  },
  type,
  isDragging,
}: SearchResultItemProps) {
  const isQuery = type === "queries";

  const handleClick = (e: React.MouseEvent) => {
    if (isQuery && isDragging?.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <li key={id} className={clsx(isQuery && "shrink-0")}>
      <Link
        className={clsx(
          isQuery ? "block" : "flex gap-4",
          isQuery && "whitespace-nowrap",
        )}
        to={
          __typename === "SearchQuerySuggestion" || !url
            ? `/search?q=${id}`
            : url
        }
        data-type={__typename}
        onClick={handleClick}
      >
        {!isQuery && __typename === "Product" && (
          <div className="h-20 w-20 shrink-0">
            {image?.url && (
              <Image
                alt={image.altText ?? ""}
                src={image.url}
                width={200}
                aspectRatio="1/1"
              />
            )}
          </div>
        )}
        {isQuery ? (
          // Simple title for query suggestions
          styledTitle ? (
            <span dangerouslySetInnerHTML={{ __html: styledTitle }} />
          ) : (
            <span>{title}</span>
          )
        ) : (
          // Full layout for products and articles
          <div className="flex flex-col justify-center gap-1">
            {/* {vendor && (
              <div className="text-body-subtle text-sm">By {vendor}</div>
            )} */}
            {styledTitle ? (
              <RevealUnderline as="div" className="ff-heading">
                <span dangerouslySetInnerHTML={{ __html: styledTitle }} />
              </RevealUnderline>
            ) : (
              <div
                className={clsx(
                  __typename === "Product" ? "line-clamp-1" : "line-clamp-2",
                )}
              >
                <span className="font-normal">{title}</span>
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
        )}
      </Link>
    </li>
  );
}
