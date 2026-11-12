import { createCartServerHandlers, gql } from "@shopify/hydrogen";

export const CART_FRAGMENT = gql(`fragment CartFragment on Cart {
  updatedAt
  id
  appliedGiftCards {
    id
    lastCharacters
    amountUsed {
      amount
      currencyCode
    }
  }
  checkoutUrl
  totalQuantity
  buyerIdentity {
    countryCode
    customer {
      id
      email
      firstName
      lastName
      displayName
    }
    email
    phone
  }
  lines(first: 250) {
    nodes {
      ...AspenCartLine
      ...AspenCartLineComponent
    }
  }
  cost {
    subtotalAmount {
      amount
      currencyCode
    }
    totalAmount {
      amount
      currencyCode
    }
  }
  note
  attributes {
    key
    value
  }
  discountCodes {
    code
    applicable
  }
}

fragment AspenCartLine on CartLine {
  id
  quantity
  attributes {
    key
    value
  }
  discountAllocations {
    discountedAmount {
      amount
      currencyCode
    }
    ... on CartCodeDiscountAllocation {
      code
    }
    ... on CartAutomaticDiscountAllocation {
      title
    }
    ... on CartCustomDiscountAllocation {
      title
    }
  }
  cost {
    totalAmount {
      amount
      currencyCode
    }
    amountPerQuantity {
      amount
      currencyCode
    }
    compareAtAmountPerQuantity {
      amount
      currencyCode
    }
  }
  sellingPlanAllocation {
    sellingPlan {
      id
      name
      description
      recurringDeliveries
      options {
        name
        value
      }
    }
  }
  merchandise {
    ... on ProductVariant {
      id
      availableForSale
      quantityAvailable
      currentlyNotInStock
      quantityRule {
        minimum
        maximum
        increment
      }
      compareAtPrice {
        amount
        currencyCode
      }
      price {
        amount
        currencyCode
      }
      requiresShipping
      title
      image {
        id
        url
        altText
        width
        height
      }
      product {
        handle
        title
        id
        vendor
      }
      selectedOptions {
        name
        value
      }
    }
  }
}

fragment AspenCartLineComponent on ComponentizableCartLine {
  id
  quantity
  attributes {
    key
    value
  }
  discountAllocations {
    discountedAmount {
      amount
      currencyCode
    }
    ... on CartCodeDiscountAllocation {
      code
    }
    ... on CartAutomaticDiscountAllocation {
      title
    }
    ... on CartCustomDiscountAllocation {
      title
    }
  }
  cost {
    totalAmount {
      amount
      currencyCode
    }
    amountPerQuantity {
      amount
      currencyCode
    }
    compareAtAmountPerQuantity {
      amount
      currencyCode
    }
  }
  merchandise {
    ... on ProductVariant {
      id
      availableForSale
      quantityAvailable
      currentlyNotInStock
      quantityRule {
        minimum
        maximum
        increment
      }
      compareAtPrice {
        amount
        currencyCode
      }
      price {
        amount
        currencyCode
      }
      requiresShipping
      title
      image {
        id
        url
        altText
        width
        height
      }
      product {
        handle
        title
        id
        vendor
      }
      selectedOptions {
        name
        value
      }
      requiresComponents
      components(first: 10) {
        nodes {
          productVariant {
            id
            title
            product {
              handle
            }
          }
          quantity
        }
      }
    }
  }
}`);
export const cartHandlers = createCartServerHandlers({
  fragment: CART_FRAGMENT,
});
