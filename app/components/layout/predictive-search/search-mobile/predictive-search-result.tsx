import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { ProductCardRating } from "~/components/product/product-card-rating";
import { SpacedMoney } from "~/components/product/variant-prices";
import type {
  NormalizedPredictiveSearchResultItem,
  NormalizedPredictiveSearchResults,
} from "~/types/predictive-search";
import { isDiscounted } from "~/utils/product";
import { SuggestionTitle } from "../suggestion-title";

type SearchResultType = NormalizedPredictiveSearchResults[number]["type"];

type SearchResultTypeProps = {
  items?: NormalizedPredictiveSearchResultItem[];
  type: SearchResultType;
};

export function PredictiveSearchResult({ items, type }: SearchResultTypeProps) {
  const { t } = useTranslation();

  if (type === "queries") {
    return <QueryResults items={items} />;
  }

  if (!items?.length) {
    const emptyKey = {
      articles: "search.noArticlesAvailable",
      collections: "search.noCollectionsAvailable",
      pages: "search.noPagesAvailable",
      products: "search.noProductsAvailable",
    }[type];

    return (
      <p className="text-[#524B46] text-sm">
        {t(emptyKey || "search.noResults")}
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
    <ul className="space-y-4 text-[#343231] text-sm leading-5">
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
  const { t } = useTranslation();

  return (
    <section aria-labelledby="predictive-search-suggestions">
      <h2
        id="predictive-search-suggestions"
        className="border-[#D8D8D8] border-b pb-[11px] font-body font-semibold text-[14px] uppercase leading-[160%] tracking-[0.28px] text-[var(--color-text-subtle,#524B46)]"
      >
        {t("search.suggestions")}
      </h2>
      <ul className="scrollbar-hide flex gap-5 overflow-x-auto pt-[22px] pb-0.5">
        {items?.map((item) => (
          <li key={item.id} className="shrink-0 whitespace-nowrap text-sm">
            <Link
              to={item.url || `/search?q=${encodeURIComponent(item.id)}`}
              className="font-normal"
            >
              <SuggestionTitle
                title={item.title}
                styledTitle={item.styledTitle}
              />
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
        className="grid min-h-[100px] grid-cols-[100px_1fr] items-center gap-4 font-normal"
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
        <div className="flex min-w-0 flex-col justify-center gap-2 font-normal text-sm">
          <ProductCardRating
            ratingValue={item.ratingValue}
            ratingCountValue={item.ratingCountValue}
            className="text-[#524B46]"
            useDotDecimal
          />
          <p className="line-clamp-2 font-normal text-[#343231] uppercase leading-5">
            {item.title}
          </p>
          {item.price && (
            <div className="flex gap-2 font-normal text-[#343231] leading-5">
              <SpacedMoney data={item.price as MoneyV2} />
              {isDiscounted(
                item.price as MoneyV2,
                item.compareAtPrice as MoneyV2,
              ) && (
                <span className="strike text-(--color-compare-price-text)">
                  <SpacedMoney data={item.compareAtPrice as MoneyV2} />
                </span>
              )}
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
      <Link
        to={item.url}
        className="block font-normal text-[#343231] text-sm uppercase leading-5 tracking-[0.02em]"
      >
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
        <span className="block font-normal">{item.title}</span>
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
    <li>
      <Link to={item.url} className="block w-fit font-normal">
        {item.title}
      </Link>
    </li>
  );
}
