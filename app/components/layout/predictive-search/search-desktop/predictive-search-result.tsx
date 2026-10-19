import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { ProductCardRating } from "~/components/product/product-card-rating";
import { SwatchFill, swatchFrameClassName } from "~/components/product/swatch";
import { CompareAtPrice } from "~/components/product/variant-prices";
import type {
  NormalizedPredictiveSearchResultItem,
  NormalizedPredictiveSearchResults,
  PredictiveSearchSwatch,
} from "~/types/predictive-search";
import { isDiscounted } from "~/utils/product";
import { SuggestionTitle } from "../suggestion-title";

type SearchResultType = NormalizedPredictiveSearchResults[number]["type"];

export function PredictiveSearchResult({
  items,
  type,
}: {
  items?: NormalizedPredictiveSearchResultItem[];
  type: SearchResultType;
}) {
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
      <ul className="grid grid-cols-4 gap-4">
        {items.map((item) => (
          <ProductResultItem item={item} key={item.id} />
        ))}
      </ul>
    );
  }

  if (type === "collections") {
    return (
      <ul className="grid grid-cols-4 items-start gap-4">
        {items.map((item) => (
          <CollectionResultItem item={item} key={item.id} />
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-4 text-[#343231] text-sm leading-5">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={item.url} className="block w-fit font-normal leading-5">
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function QueryResults({
  items,
}: {
  items?: NormalizedPredictiveSearchResultItem[];
}) {
  if (!items?.length) {
    return null;
  }

  return (
    <ul className="space-y-[10px] text-[#343231] text-sm leading-5">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={item.url || `/search?q=${encodeURIComponent(item.id)}`}
            className="block w-fit font-normal"
          >
            <SuggestionTitle
              title={item.title}
              styledTitle={item.styledTitle}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProductResultItem({
  item,
}: {
  item: NormalizedPredictiveSearchResultItem;
}) {
  const { t } = useTranslation();

  return (
    <li className="min-w-0">
      <Link to={item.url} className="block font-normal">
        <div className="aspect-square overflow-hidden rounded-xl bg-[#F0EFED]">
          {item.image?.url && (
            <Image
              alt={item.image.altText || item.title}
              src={item.image.url}
              width={516}
              height={516}
              sizes="258px"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        {Boolean(item.swatches?.length) && (
          <ul
            className="mt-5 flex items-center gap-1.5"
            aria-label={t("product.availableColors", { product: item.title })}
          >
            {item.swatches.slice(0, 4).map((swatch) => (
              <Swatch key={swatch.name} swatch={swatch} />
            ))}
          </ul>
        )}
        <div className={item.swatches?.length ? "mt-3" : "mt-5"}>
          <ProductCardRating
            ratingValue={item.ratingValue}
            ratingCountValue={item.ratingCountValue}
            className="!text-sm text-[#524B46]"
          />
          <p className="mt-3 line-clamp-1 font-normal text-[#343231] text-sm uppercase leading-5">
            {item.title}
          </p>
          {item.price && (
            <div className="mt-1 flex gap-2 font-normal text-[#343231] text-sm leading-5">
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

function Swatch({ swatch }: { swatch: PredictiveSearchSwatch }) {
  const swatchColor = swatch.color || swatch.name;

  return (
    <li
      className={swatchFrameClassName("small", swatch.selected)}
      title={swatch.name}
    >
      <SwatchFill size="small" color={swatchColor} image={swatch.image} />
    </li>
  );
}

function CollectionResultItem({
  item,
}: {
  item: NormalizedPredictiveSearchResultItem;
}) {
  return (
    <li className="min-w-0">
      <Link
        to={item.url}
        className="group/collection block font-normal text-[#343231] text-sm uppercase leading-5 tracking-[0.02em]"
      >
        {item.image?.url && (
          <div className="aspect-[258/194] overflow-hidden rounded-xl bg-[#F0EFED]">
            <Image
              alt={item.image.altText || item.title}
              src={item.image.url}
              width={516}
              height={388}
              sizes="258px"
              className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 desktop:motion-safe:group-hover/collection:scale-105"
            />
          </div>
        )}
        <span
          className={
            item.image?.url ? "mt-4 block font-normal" : "block font-normal"
          }
        >
          {item.title}
        </span>
      </Link>
    </li>
  );
}
