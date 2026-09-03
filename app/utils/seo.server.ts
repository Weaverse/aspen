import type { SeoConfig } from "@shopify/hydrogen";
import type {
  Article,
  Blog,
  Collection,
  Image,
  Page,
  Product,
  ShopPolicy,
} from "@shopify/hydrogen/storefront-api-types";
import type { BreadcrumbList, CollectionPage, Offer } from "schema-dts";
import type { ProductQuery, ShopFragment } from "storefront-api.generated";
import { getLocaleSegment } from "~/utils/locale";
import { createLocalizedSeoConfig, getMetadataCopy } from "~/utils/metadata";

const DEFAULT_SITE_TITLE = "Aspen";

function storefrontUrl(url: string, pathname: string) {
  const requestUrl = new URL(url);
  const locale = getLocaleSegment(requestUrl.pathname);
  const localePrefix = locale ? `/${locale}` : "";
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${requestUrl.origin}${localePrefix}${normalizedPath}`;
}

export function resolveSeoTitle(
  ...candidates: Array<string | null | undefined>
) {
  return (
    candidates
      .find((candidate): candidate is string => Boolean(candidate?.trim()))
      ?.trim() ?? DEFAULT_SITE_TITLE
  );
}

function root({
  shop,
  url,
}: {
  shop: ShopFragment;
  url: Request["url"];
}): SeoConfig {
  const title = resolveSeoTitle(shop?.name, DEFAULT_SITE_TITLE);

  return {
    title,
    titleTemplate: "%s | Weaverse Hydrogen Demo Store",
    description: truncate(shop?.description ?? ""),
    handle: "@weaverse",
    url,
    robots: {
      noIndex: false,
      noFollow: false,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: title,
      logo: shop.brand?.logo?.image?.url,
      sameAs: [
        "https://twitter.com/weaverseio",
        "https://facebook.com/weaverse",
        "https://instagram.com/weaverse.io",
        "https://youtube.com/@weaverse",
      ],
      url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${storefrontUrl(url, "/search")}?q={search_term}`,
        query: "required name='search_term'",
      },
    },
  };
}

function home({ url }: { url: Request["url"] }): SeoConfig {
  return createLocalizedSeoConfig({
    locale: url,
    page: "home",
    seo: {
      url,
      robots: {
        noIndex: false,
        noFollow: false,
      },
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Aspen",
      },
    },
  });
}

function productJsonLd({
  product: productData,
  selectedVariant,
  url,
}: {
  product: ProductQuery["product"];
  selectedVariant: ProductQuery["product"]["selectedOrFirstAvailableVariant"];
  url: Request["url"];
}): SeoConfig["jsonLd"] {
  const productsCopy = getMetadataCopy(url, "products");
  const description = truncate(
    productData?.seo?.description ?? productData?.description,
  );

  // Create offers array from adjacent variants
  const offers: Offer[] = [];
  if (productData?.adjacentVariants) {
    for (const variant of productData.adjacentVariants) {
      const variantUrl = new URL(url);
      for (const option of variant.selectedOptions) {
        variantUrl.searchParams.set(option.name, option.value);
      }
      const availability = variant.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

      offers.push({
        "@type": "Offer",
        availability,
        price: Number.parseFloat(variant.price.amount),
        priceCurrency: variant.price.currencyCode,
        sku: variant?.sku ?? "",
        url: variantUrl.toString(),
      });
    }
  }

  // If no adjacent variants, add the selected variant
  if (offers.length === 0 && selectedVariant) {
    const availability = selectedVariant.availableForSale
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

    offers.push({
      "@type": "Offer",
      availability,
      price: Number.parseFloat(selectedVariant.price.amount),
      priceCurrency: selectedVariant.price.currencyCode,
      sku: selectedVariant?.sku ?? "",
      url,
    });
  }

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: productsCopy.title,
          item: storefrontUrl(url, "/products"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: productData.title,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      brand: {
        "@type": "Brand",
        name: productData.vendor,
      },
      description,
      image: [selectedVariant?.image?.url ?? ""],
      name: productData.title,
      offers,
      sku: selectedVariant?.sku ?? "",
      url,
    },
  ];
}

function product({
  product: productData,
  url,
}: {
  product: ProductQuery["product"];
  url: Request["url"];
}): SeoConfig {
  const description = truncate(
    productData?.seo?.description ?? productData?.description ?? "",
  );
  const selectedVariant = productData?.selectedOrFirstAvailableVariant;
  return createLocalizedSeoConfig({
    locale: url,
    page: "product",
    seo: {
      title: resolveSeoTitle(
        productData?.seo?.title,
        productData?.title,
        "Product",
      ),
      description,
      media: selectedVariant?.image,
      jsonLd: productJsonLd({ product: productData, selectedVariant, url }),
    },
  });
}

type CollectionRequiredFields = Omit<
  Collection,
  "products" | "descriptionHtml" | "metafields" | "image" | "updatedAt"
> & {
  products: { nodes: Pick<Product, "handle">[] };
  image?: null | Pick<Image, "url" | "height" | "width" | "altText">;
  descriptionHtml?: null | Collection["descriptionHtml"];
  updatedAt?: null | Collection["updatedAt"];
  metafields?: null | Collection["metafields"];
};

function collectionJsonLd({
  url,
  collection: collectionData,
}: {
  url: Request["url"];
  collection: CollectionRequiredFields;
}): SeoConfig["jsonLd"] {
  const collectionsCopy = getMetadataCopy(url, "collections");
  const itemListElement: CollectionPage["mainEntity"] =
    collectionData.products.nodes.map((prod, index) => {
      return {
        "@type": "ListItem",
        position: index + 1,
        url: storefrontUrl(url, `/products/${prod.handle}`),
      };
    });

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: collectionsCopy.title,
          item: storefrontUrl(url, "/collections"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: collectionData.title,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: resolveSeoTitle(
        collectionData?.seo?.title,
        collectionData?.title,
        "Collection",
      ),
      description: truncate(
        collectionData?.seo?.description ?? collectionData?.description ?? "",
      ),
      image: collectionData?.image?.url,
      url,
      mainEntity: {
        "@type": "ItemList",
        itemListElement,
      },
    },
  ];
}

function collection({
  collection: collectionData,
  url,
}: {
  collection: CollectionRequiredFields;
  url: Request["url"];
}): SeoConfig {
  return createLocalizedSeoConfig({
    locale: url,
    page: "collection",
    seo: {
      title: resolveSeoTitle(
        collectionData?.seo?.title,
        collectionData?.title,
        "Collection",
      ),
      description: truncate(
        collectionData?.seo?.description ?? collectionData?.description ?? "",
      ),
      titleTemplate: "%s | Collection",
      url,
      media: {
        type: "image",
        url: collectionData?.image?.url,
        height: collectionData?.image?.height,
        width: collectionData?.image?.width,
        altText: collectionData?.image?.altText,
      },
      jsonLd: collectionJsonLd({ collection: collectionData, url }),
    },
  });
}

type CollectionListRequiredFields = {
  nodes: Omit<CollectionRequiredFields, "products">[];
};

function collectionsJsonLd({
  url,
  collections,
}: {
  url: Request["url"];
  collections: CollectionListRequiredFields;
}): SeoConfig["jsonLd"] {
  const copy = getMetadataCopy(url, "collections");
  const itemListElement: CollectionPage["mainEntity"] = collections.nodes.map(
    (col, index) => {
      return {
        "@type": "ListItem",
        position: index + 1,
        url: storefrontUrl(url, `/collections/${col.handle}`),
      };
    },
  );

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.title,
    description: copy.description,
    url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement,
    },
  };
}

function listCollections({
  collections,
  url,
}: {
  collections: CollectionListRequiredFields;
  url: Request["url"];
}): SeoConfig {
  return createLocalizedSeoConfig({
    locale: url,
    page: "collections",
    seo: {
      url,
      jsonLd: collectionsJsonLd({ collections, url }),
    },
  });
}

function article({
  article: articleData,
  url,
}: {
  article: Pick<
    Article,
    "title" | "contentHtml" | "seo" | "publishedAt" | "excerpt"
  > & {
    image?: null | Pick<
      NonNullable<Article["image"]>,
      "url" | "height" | "width" | "altText"
    >;
  };
  url: Request["url"];
}): SeoConfig {
  return createLocalizedSeoConfig({
    locale: url,
    page: "article",
    seo: {
      title: resolveSeoTitle(
        articleData?.seo?.title,
        articleData?.title,
        "Article",
      ),
      description: truncate(articleData?.seo?.description ?? ""),
      titleTemplate: "%s | Journal",
      url,
      media: {
        type: "image",
        url: articleData?.image?.url,
        height: articleData?.image?.height,
        width: articleData?.image?.width,
        altText: articleData?.image?.altText,
      },
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        alternativeHeadline: articleData.title,
        articleBody: articleData.contentHtml,
        datePublished: articleData?.publishedAt,
        description: truncate(
          articleData?.seo?.description || articleData?.excerpt || "",
        ),
        headline: resolveSeoTitle(
          articleData?.seo?.title,
          articleData?.title,
          "Article",
        ),
        image: articleData?.image?.url,
        url,
      },
    },
  });
}

function blog({
  blog: blogData,
  url,
}: {
  blog: Pick<Blog, "seo" | "title">;
  url: Request["url"];
}): SeoConfig {
  const title = resolveSeoTitle(blogData?.seo?.title, blogData?.title, "Blog");

  return createLocalizedSeoConfig({
    locale: url,
    page: "blogs",
    seo: {
      title,
      description: truncate(blogData?.seo?.description || ""),
      titleTemplate: "%s | Blog",
      url,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: title,
        description: blogData?.seo?.description || "",
        url,
      },
    },
  });
}

function page({
  page: pageData,
  url,
}: {
  page: Pick<Page, "title" | "seo">;
  url: Request["url"];
}): SeoConfig {
  const title = resolveSeoTitle(pageData?.seo?.title, pageData?.title, "Page");

  return createLocalizedSeoConfig({
    locale: url,
    page: "page",
    seo: {
      description: truncate(pageData?.seo?.description || ""),
      title,
      titleTemplate: "%s | Page",
      url,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
      },
    },
  });
}

function policy({
  policy: policyData,
  url,
}: {
  policy: Pick<ShopPolicy, "title" | "body">;
  url: Request["url"];
}): SeoConfig {
  return createLocalizedSeoConfig({
    locale: url,
    page: "policy",
    seo: {
      description: truncate(policyData?.body ?? ""),
      title: resolveSeoTitle(policyData?.title, "Policy"),
      url,
    },
  });
}

function policies({
  policies: policiesData,
  url,
}: {
  policies: Pick<ShopPolicy, "title" | "handle">[];
  url: Request["url"];
}): SeoConfig {
  const copy = getMetadataCopy(url, "policies");
  const itemListElement: BreadcrumbList["itemListElement"] = policiesData
    .filter(Boolean)
    .map((pol, index) => {
      return {
        "@type": "ListItem",
        position: index + 1,
        name: pol.title,
        item: storefrontUrl(url, `/policies/${pol.handle}`),
      };
    });
  return createLocalizedSeoConfig({
    locale: url,
    page: "policies",
    seo: {
      url,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement,
        },
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          description: copy.description,
          name: copy.title,
          url,
        },
      ],
    },
  });
}

export const seoPayload = {
  article,
  blog,
  collection,
  home,
  listCollections,
  page,
  policies,
  policy,
  product,
  root,
};

/**
 * Truncate a string to a given length, adding an ellipsis if it was truncated
 * @param str - The string to truncate
 * @param num - The maximum length of the string
 * @returns The truncated string
 * @example
 * ```js
 * truncate('Hello world', 5) // 'Hello...'
 * ```
 */
function truncate(str: string, num = 155): string {
  if (typeof str !== "string") {
    return "";
  }
  if (str.length <= num) {
    return str;
  }
  return `${str.slice(0, num - 3)}...`;
}
