import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { ProductCardRating } from "~/components/product/product-card-rating";
import { CompareAtPrice } from "~/components/product/variant-prices";
import type {
  NormalizedPredictiveSearchResultItem,
  NormalizedPredictiveSearchResults,
} from "~/types/predictive-search";
import { isDiscounted } from "~/utils/product";

type SearchResultType = NormalizedPredictiveSearchResults[number]["type"];

type SearchResultTypeProps = {
  items?: NormalizedPredictiveSearchResultItem[];
  type: SearchResultType;
};

export function PredictiveSearchResult({ items, type }: SearchResultTypeProps) {
  if (type === "queries") {
    return <QueryResults items={items} />;
  }

  if (!items?.length) {
    return (
      <p className="pt-5 text-[#524B46] text-sm">
        No {type === "pages" ? "pages" : type} available.
      </p>
    );
  }

  if (type === "products") {
    return (
      <ul className="space-y-2.5">
        {items.map((item) => (
          <ProductResultItem item={item} key={item.id} />
        ))}
      </ul>
    );
  }

  if (type === "collections") {
    return (
      <ul className="space-y-7">
        {items.map((item) => (
          <CollectionResultItem item={item} key={item.id} />
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <TextResultItem item={item} key={item.id} />
      ))}
    </ul>
  );
}

function QueryResults({
  items,
}: {
  items?: NormalizedPredictiveSearchResultItem[];
}) {
  return (
    <section aria-labelledby="predictive-search-suggestions">
      <h2
        id="predictive-search-suggestions"
        className="border-[#D8D8D8] border-b pb-[11px] font-semibold text-sm uppercase"
      >
        Suggestions
      </h2>
      <ul className="scrollbar-hide flex gap-5 overflow-x-auto pt-[22px] pb-0.5">
        {items?.map((item) => (
          <li key={item.id} className="shrink-0 whitespace-nowrap text-sm">
            <Link to={item.url || `/search?q=${encodeURIComponent(item.id)}`}>
              {item.styledTitle ? (
                <span
                  className="[&_b]:font-semibold"
                  // Shopify returns only emphasis markup in styledText. The
                  // local fallback is escaped before it reaches this field.
                  dangerouslySetInnerHTML={{ __html: item.styledTitle }}
                />
              ) : (
                item.title
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductResultItem({
  item,
}: {
  item: NormalizedPredictiveSearchResultItem;
}) {
  return (
    <li>
      <Link
        to={item.url}
        className="grid min-h-[100px] grid-cols-[100px_1fr] gap-4"
      >
        <div className="h-[100px] w-[100px] overflow-hidden rounded-xl bg-[#F0EFED]">
          {item.image?.url && (
            <Image
              alt={item.image.altText || item.title}
              src={item.image.url}
              width={200}
              height={200}
              sizes="100px"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1 text-sm">
          <ProductCardRating
            ratingValue={item.ratingValue}
            ratingCountValue={item.ratingCountValue}
            className="text-[#524B46]"
          />
          <p className="line-clamp-2 text-[#343231] uppercase leading-tight">
            {item.title}
          </p>
          {item.price && (
            <div className="flex gap-2 text-[#343231]">
              <Money withoutTrailingZeros data={item.price as MoneyV2} />
              {isDiscounted(
                item.price as MoneyV2,
                item.compareAtPrice as MoneyV2,
              ) && <CompareAtPrice data={item.compareAtPrice as MoneyV2} />}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

function CollectionResultItem({
  item,
}: {
  item: NormalizedPredictiveSearchResultItem;
}) {
  return (
    <li>
      <Link to={item.url} className="block text-sm uppercase">
        {item.image?.url && (
          <div className="mb-4 aspect-[341/194] overflow-hidden rounded-xl bg-[#F0EFED]">
            <Image
              alt={item.image.altText || item.title}
              src={item.image.url}
              width={682}
              height={388}
              sizes="341px"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <span>{item.title}</span>
      </Link>
    </li>
  );
}

function TextResultItem({
  item,
}: {
  item: NormalizedPredictiveSearchResultItem;
}) {
  return (
    <li className="text-sm">
      <Link
        to={item.url}
        className={clsx("block", !item.url && "pointer-events-none")}
      >
        {item.title}
      </Link>
    </li>
  );
}
