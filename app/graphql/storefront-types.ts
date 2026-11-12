import type { StorefrontApi } from "@shopify/hydrogen";
export type ProductVariantFragment = StorefrontApi.ResultOf<
  typeof import("~/graphql/fragments").PRODUCT_VARIANT_FRAGMENT
>;
export type ProductOptionFragment = StorefrontApi.ResultOf<
  typeof import("~/graphql/fragments").PRODUCT_OPTION_FRAGMENT
>;
export type ProductCardFragment = StorefrontApi.ResultOf<
  typeof import("~/graphql/fragments").PRODUCT_CARD_FRAGMENT
>;
export type MediaFragment = StorefrontApi.ResultOf<
  typeof import("~/graphql/fragments").MEDIA_FRAGMENT
>;
export type ProductQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/graphql/queries").PRODUCT_QUERY
>;
export type ProductQuery = StorefrontApi.ResultOf<
  typeof import("~/graphql/queries").PRODUCT_QUERY
>;
export type GetShopPrimaryDomainQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).$shopid.orders.$token.authenticate").SHOP_PRIMARY_DOMAIN_QUERY
>;
export type GetShopPrimaryDomainQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).$shopid.orders.$token.authenticate").SHOP_PRIMARY_DOMAIN_QUERY
>;
export type ShopQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale)._index").SHOP_QUERY
>;
export type ShopQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale)._index").SHOP_QUERY
>;
export type CollectionProductCountQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).api.collection.$collectionHandle.product-count").COLLECTION_COUNT_QUERY
>;
export type CollectionProductCountQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).api.collection.$collectionHandle.product-count").COLLECTION_COUNT_QUERY
>;
export type FeaturedItemsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).api.featured-items").FEATURED_ITEMS_QUERY
>;
export type FeaturedItemsQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).api.featured-items").FEATURED_ITEMS_QUERY
>;
export type PredictiveArticleFragment = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).api.predictive-search").PREDICTIVE_SEARCH_QUERY_PredictiveArticle
>;
export type PredictiveCollectionFragment = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).api.predictive-search").PREDICTIVE_SEARCH_QUERY_PredictiveCollection
>;
export type PredictivePageFragment = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).api.predictive-search").PREDICTIVE_SEARCH_QUERY_PredictivePage
>;
export type PredictiveProductFragment = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).api.predictive-search").PREDICTIVE_SEARCH_QUERY_PredictiveProduct
>;
export type PredictiveQueryFragment = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).api.predictive-search").PREDICTIVE_SEARCH_QUERY_PredictiveQuery
>;
export type PredictiveSearchQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).api.predictive-search").PREDICTIVE_SEARCH_QUERY
>;
export type PredictiveSearchQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).api.predictive-search").PREDICTIVE_SEARCH_QUERY
>;
export type ApiAllProductsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).api.products").API_ALL_PRODUCTS_QUERY
>;
export type ApiAllProductsQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).api.products").API_ALL_PRODUCTS_QUERY
>;
export type ArticleQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).blogs.$articleHandle").ARTICLE_QUERY
>;
export type ArticleQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).blogs.$articleHandle").ARTICLE_QUERY
>;
export type ArticleFragment = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).blogs.$articleHandle").ARTICLE_QUERY_Article
>;
export type BlogsIndexQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).blogs._index").BLOGS_INDEX_QUERY
>;
export type BlogsIndexQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).blogs._index").BLOGS_INDEX_QUERY
>;
export type BlogArticleFragment = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).blogs._index").BLOGS_INDEX_QUERY_BlogArticle
>;
export type CollectionQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).collections.$collectionHandle").COLLECTION_QUERY
>;
export type CollectionQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).collections.$collectionHandle").COLLECTION_QUERY
>;
export type CollectionSaleProductScanQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).collections.$collectionHandle").COLLECTION_SALE_PRODUCT_SCAN_QUERY
>;
export type CollectionSaleProductScanQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).collections.$collectionHandle").COLLECTION_SALE_PRODUCT_SCAN_QUERY
>;
export type CollectionsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).collections._index").COLLECTIONS_QUERY
>;
export type CollectionsQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).collections._index").COLLECTIONS_QUERY
>;
export type PageDetailsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).pages.$pageHandle").PAGE_QUERY
>;
export type PageDetailsQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).pages.$pageHandle").PAGE_QUERY
>;
export type PolicyHandleFragment = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).policies.$policyHandle").POLICY_CONTENT_QUERY_PolicyHandle
>;
export type PoliciesHandleQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).policies.$policyHandle").POLICY_CONTENT_QUERY
>;
export type PoliciesHandleQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).policies.$policyHandle").POLICY_CONTENT_QUERY
>;
export type PolicyIndexFragment = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).policies._index").POLICIES_QUERY_PolicyIndex
>;
export type PoliciesIndexQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).policies._index").POLICIES_QUERY
>;
export type PoliciesIndexQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).policies._index").POLICIES_QUERY
>;
export type AllProductsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/($locale).products._index").ALL_PRODUCTS_QUERY
>;
export type AllProductsQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).products._index").ALL_PRODUCTS_QUERY
>;
export type AllProductsSaleProductScanQueryVariables =
  StorefrontApi.VariablesOf<
    typeof import("~/routes/($locale).products._index").ALL_PRODUCTS_SALE_PRODUCT_SCAN_QUERY
  >;
export type AllProductsSaleProductScanQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/($locale).products._index").ALL_PRODUCTS_SALE_PRODUCT_SCAN_QUERY
>;
export type StoreRobotsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/routes/[robots.txt]").ROBOTS_QUERY
>;
export type StoreRobotsQuery = StorefrontApi.ResultOf<
  typeof import("~/routes/[robots.txt]").ROBOTS_QUERY
>;
export type BlogSingleQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/sections/articles/index").BLOG_QUERY
>;
export type BlogSingleQuery = StorefrontApi.ResultOf<
  typeof import("~/sections/articles/index").BLOG_QUERY
>;
export type CollectionByIdsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/sections/collection-list-dynamic/collection-items").COLLECTIONS_QUERY
>;
export type CollectionByIdsQuery = StorefrontApi.ResultOf<
  typeof import("~/sections/collection-list-dynamic/collection-items").COLLECTIONS_QUERY
>;
export type ProductsByCollectionQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/sections/featured-products/product-items").PRODUCTS_BY_COLLECTION_QUERY
>;
export type ProductsByCollectionQuery = StorefrontApi.ResultOf<
  typeof import("~/sections/featured-products/product-items").PRODUCTS_BY_COLLECTION_QUERY
>;
export type StoreLocalizationQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/utils/localization.server").LOCALIZATION_QUERY
>;
export type StoreLocalizationQuery = StorefrontApi.ResultOf<
  typeof import("~/utils/localization.server").LOCALIZATION_QUERY
>;
export type ProductRecommendationsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/utils/product").RECOMMENDED_PRODUCTS_QUERY
>;
export type ProductRecommendationsQuery = StorefrontApi.ResultOf<
  typeof import("~/utils/product").RECOMMENDED_PRODUCTS_QUERY
>;
export type LayoutQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/utils/root.server").LAYOUT_QUERY
>;
export type LayoutQuery = StorefrontApi.ResultOf<
  typeof import("~/utils/root.server").LAYOUT_QUERY
>;
export type ShopFragment = StorefrontApi.ResultOf<
  typeof import("~/utils/root.server").LAYOUT_QUERY_Shop
>;
export type MenuItemFragment = StorefrontApi.ResultOf<
  typeof import("~/utils/root.server").LAYOUT_QUERY_MenuItem
>;
export type ChildMenuItemFragment = StorefrontApi.ResultOf<
  typeof import("~/utils/root.server").LAYOUT_QUERY_ChildMenuItem
>;
export type ParentMenuItem2Fragment = StorefrontApi.ResultOf<
  typeof import("~/utils/root.server").LAYOUT_QUERY_ParentMenuItem2
>;
export type ParentMenuItemFragment = StorefrontApi.ResultOf<
  typeof import("~/utils/root.server").LAYOUT_QUERY_ParentMenuItem
>;
export type MenuFragment = StorefrontApi.ResultOf<
  typeof import("~/utils/root.server").LAYOUT_QUERY_Menu
>;
export type SwatchesQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/utils/root.server").SWATCHES_QUERY
>;
export type SwatchesQuery = StorefrontApi.ResultOf<
  typeof import("~/utils/root.server").SWATCHES_QUERY
>;
export type SaleProductCardsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/utils/sale-pagination.server").SALE_PRODUCT_CARDS_QUERY
>;
export type SaleProductCardsQuery = StorefrontApi.ResultOf<
  typeof import("~/utils/sale-pagination.server").SALE_PRODUCT_CARDS_QUERY
>;
export type SearchVisibleIndexQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/utils/search-results.server").SEARCH_INDEX_QUERY
>;
export type SearchVisibleIndexQuery = StorefrontApi.ResultOf<
  typeof import("~/utils/search-results.server").SEARCH_INDEX_QUERY
>;
export type SearchVisibleCardsQueryVariables = StorefrontApi.VariablesOf<
  typeof import("~/utils/search-results.server").SEARCH_CARDS_QUERY
>;
export type SearchVisibleCardsQuery = StorefrontApi.ResultOf<
  typeof import("~/utils/search-results.server").SEARCH_CARDS_QUERY
>;

export type CartApiQueryFragment = StorefrontApi.ResultOf<
  typeof import("~/.server/cart").CART_FRAGMENT
>;
export type CartLineFragment = CartApiQueryFragment["lines"]["nodes"][number];
export type CartLineComponentFragment = CartLineFragment;
export type MoneyFragment = import("@shopify/hydrogen").MoneyV2;

export type Media_MediaImage_Fragment = Extract<
  MediaFragment,
  { __typename: "MediaImage" }
>;
export type Media_Video_Fragment = Extract<
  MediaFragment,
  { __typename: "Video" }
>;
