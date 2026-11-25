import type {
  InferResult,
  InferVariables,
  SourceOf,
} from "@shopify/hydrogen/customer-account";
export type CustomerAddressUpdateMutationVariables = InferVariables<
  SourceOf<
    typeof import("~/routes/($locale).account.address.$id").UPDATE_ADDRESS_MUTATION
  >
>;
export type CustomerAddressUpdateMutation = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.address.$id").UPDATE_ADDRESS_MUTATION
  >
>;
export type CustomerAddressDeleteMutationVariables = InferVariables<
  SourceOf<
    typeof import("~/routes/($locale).account.address.$id").DELETE_ADDRESS_MUTATION
  >
>;
export type CustomerAddressDeleteMutation = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.address.$id").DELETE_ADDRESS_MUTATION
  >
>;
export type CustomerAddressCreateMutationVariables = InferVariables<
  SourceOf<
    typeof import("~/routes/($locale).account.address.$id").CREATE_ADDRESS_MUTATION
  >
>;
export type CustomerAddressCreateMutation = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.address.$id").CREATE_ADDRESS_MUTATION
  >
>;
export type OrderMoneyFragment = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.orders.$id").CUSTOMER_ORDER_QUERY_OrderMoney
  >
>;
export type DiscountApplicationFragment = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.orders.$id").CUSTOMER_ORDER_QUERY_DiscountApplication
  >
>;
export type OrderLineItemFullFragment = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.orders.$id").CUSTOMER_ORDER_QUERY_OrderLineItemFull
  >
>;
export type OrderFragment = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.orders.$id").CUSTOMER_ORDER_QUERY_Order
  >
>;
export type OrderQueryVariables = InferVariables<
  SourceOf<
    typeof import("~/routes/($locale).account.orders.$id").CUSTOMER_ORDER_QUERY
  >
>;
export type OrderQuery = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.orders.$id").CUSTOMER_ORDER_QUERY
  >
>;
export type OrderItemFragment = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.orders._index").ORDER_ITEM_FRAGMENT
  >
>;
export type CustomerOrdersFragment = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.orders._index").CUSTOMER_ORDERS_FRAGMENT
  >
>;
export type CustomerOrdersQueryVariables = InferVariables<
  SourceOf<
    typeof import("~/routes/($locale).account.orders._index").CUSTOMER_ORDERS_QUERY
  >
>;
export type CustomerOrdersQuery = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.orders._index").CUSTOMER_ORDERS_QUERY
  >
>;
export type CustomerUpdateMutationVariables = InferVariables<
  SourceOf<
    typeof import("~/routes/($locale).account.profile").CUSTOMER_UPDATE_MUTATION
  >
>;
export type CustomerUpdateMutation = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account.profile").CUSTOMER_UPDATE_MUTATION
  >
>;
export type CustomerDetailsQueryVariables = InferVariables<
  SourceOf<typeof import("~/routes/($locale).account").CUSTOMER_DETAILS_QUERY>
>;
export type CustomerDetailsQuery = InferResult<
  SourceOf<typeof import("~/routes/($locale).account").CUSTOMER_DETAILS_QUERY>
>;
export type OrderCardFragment = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account").CUSTOMER_DETAILS_QUERY_OrderCard
  >
>;
export type AddressPartialFragment = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account").CUSTOMER_DETAILS_QUERY_AddressPartial
  >
>;
export type CustomerDetailsFragment = InferResult<
  SourceOf<
    typeof import("~/routes/($locale).account").CUSTOMER_DETAILS_QUERY_CustomerDetails
  >
>;
export type LoyaltyCustomerQueryVariables = InferVariables<
  SourceOf<typeof import("~/utils/loyalty.server").LOYALTY_CUSTOMER_QUERY>
>;
export type LoyaltyCustomerQuery = InferResult<
  SourceOf<typeof import("~/utils/loyalty.server").LOYALTY_CUSTOMER_QUERY>
>;
export type WishlistCustomerQueryVariables = InferVariables<
  SourceOf<typeof import("~/utils/wishlist.server").WISHLIST_QUERY>
>;
export type WishlistCustomerQuery = InferResult<
  SourceOf<typeof import("~/utils/wishlist.server").WISHLIST_QUERY>
>;
export type WishlistUpdateMutationVariables = InferVariables<
  SourceOf<typeof import("~/utils/wishlist.server").WISHLIST_UPDATE_MUTATION>
>;
export type WishlistUpdateMutation = InferResult<
  SourceOf<typeof import("~/utils/wishlist.server").WISHLIST_UPDATE_MUTATION>
>;
