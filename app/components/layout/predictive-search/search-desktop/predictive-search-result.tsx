import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { ProductCardRating } from "~/components/product/product-card-rating";
import { CompareAtPrice } from "~/components/product/variant-prices";
import type {
  NormalizedPredictiveSearchResultItem,
  NormalizedPredictiveSearchResults,
  PredictiveSearchSwatch,
} from "~/types/predictive-search";
import { isValidColor } from "~/utils/misc";
import { isDiscounted } from "~/utils/product";

type SearchResultType = NormalizedPredictiveSearchResults[number]["type"];

export function PredictiveSearchResult({
  items,
  type,
}: {
  items?: NormalizedPredictiveSearchResultItem[];
  type: SearchResultType;
}) {
  if (type === "queries") {
    return <QueryResults items={items} />;
  }

  if (!items?.length) {
    return (
      <p className="text-[#524B46] text-sm">
        No {type === "pages" ? "pages" : type} available.
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
      <ul className="grid grid-cols-4 gap-4">
        {items.map((item) => (
          <CollectionResultItem item={item} key={item.id} />
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-[10px] text-[#343231] text-sm leading-5">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={item.url} className="block w-fit">
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
            className="block w-fit"
          >
            {item.styledTitle ? (
              <span
                className="[&_b]:font-semibold"
                // Shopify returns only emphasis markup. The local fallback is
                // escaped before being assigned to styledTitle.
                dangerouslySetInnerHTML={{ __html: item.styledTitle }}
              />
            ) : (
              item.title
            )}
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
  return (
    <li className="min-w-0">
      <Link to={item.url} className="block">
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
            aria-label={`Available colors for ${item.title}`}
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
          <p className="mt-3 line-clamp-1 text-[#343231] text-sm uppercase leading-5">
            {item.title}
          </p>
          {item.price && (
            <div className="mt-1 flex gap-2 text-[#343231] text-sm leading-5">
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
      className={
        swatch.selected
          ? "flex size-[18px] items-center justify-center rounded-[5px] border border-[#9D9D9D] p-0.5"
          : "flex size-[18px] items-center justify-center rounded-[5px] border border-[#D8D8D8] p-0.5"
      }
      title={swatch.name}
    >
      {swatch.image?.url ? (
        <Image
          alt=""
          src={swatch.image.url}
          width={14}
          height={14}
          sizes="14px"
          className="h-full w-full rounded-[2px] object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="h-full w-full rounded-[2px]"
          style={{
            backgroundColor: isValidColor(swatchColor)
              ? swatchColor
              : "#ECE9DE",
          }}
        />
      )}
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
      <Link to={item.url} className="block text-[#343231] text-sm uppercase">
        {item.image?.url && (
          <div className="aspect-[258/194] overflow-hidden rounded-xl bg-[#F0EFED]">
            <Image
              alt={item.image.altText || item.title}
              src={item.image.url}
              width={516}
              height={388}
              sizes="258px"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <span className={item.image?.url ? "mt-4 block" : "block"}>
          {item.title}
        </span>
      </Link>
    </li>
  );
}
