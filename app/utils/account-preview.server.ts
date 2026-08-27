import type {
  CustomerDetailsFragment,
  OrderFragment,
} from "customer-account-api.generated";
import { createCookie } from "react-router";

export type AccountPreviewAddress =
  CustomerDetailsFragment["addresses"]["edges"][number]["node"];

export interface AccountPreviewState {
  firstName: string;
  lastName: string;
  addresses: AccountPreviewAddress[];
  defaultAddressId: string | null;
  nextAddressId: number;
}

const accountPreviewCookie = createCookie("__aspen_account_preview", {
  httpOnly: true,
  maxAge: 60 * 60 * 24,
  path: "/",
  sameSite: "lax",
});

const DEFAULT_ADDRESSES = [
  {
    id: "preview-address-1",
    formatted: ["Kris Jenner", "Marina Complex", "Inglewood, CA", "90301"],
    firstName: "Kris",
    lastName: "Jenner",
    company: "Marina Complex",
    address1: "Marina Complex",
    address2: null,
    territoryCode: "US",
    zoneCode: "CA",
    city: "Inglewood",
    zip: "90301",
    phoneNumber: null,
  },
  {
    id: "preview-address-2",
    formatted: ["Andrew Jenner", "Marina Complex", "Inglewood, CA", "90301"],
    firstName: "Andrew",
    lastName: "Jenner",
    company: "Marina Complex",
    address1: "Marina Complex",
    address2: null,
    territoryCode: "US",
    zoneCode: "CA",
    city: "Inglewood",
    zip: "90301",
    phoneNumber: null,
  },
] satisfies AccountPreviewAddress[];

const PREVIEW_ORDER_IMAGE =
  "https://cdn.shopify.com/s/files/1/0969/1650/4944/files/Arden-Swivel-Armchair-Alpine-Angle-1688635266.webp?v=1755139284";

export function isAccountPreviewRequest(request: Request) {
  const url = new URL(request.url);
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const isDesignMode =
    url.searchParams.get("isDesignMode") === "true" ||
    url.searchParams.has("weaverseHost");

  return import.meta.env.DEV && (isLocalhost || isDesignMode);
}

export async function readAccountPreviewState(
  request: Request,
): Promise<AccountPreviewState> {
  const stored = (await accountPreviewCookie.parse(
    request.headers.get("Cookie"),
  )) as Partial<AccountPreviewState> | null;

  return {
    firstName:
      typeof stored?.firstName === "string" ? stored.firstName : "Kris",
    lastName: typeof stored?.lastName === "string" ? stored.lastName : "Jenner",
    addresses: Array.isArray(stored?.addresses)
      ? stored.addresses
      : DEFAULT_ADDRESSES.map(cloneAddress),
    defaultAddressId:
      typeof stored?.defaultAddressId === "string" ||
      stored?.defaultAddressId === null
        ? stored.defaultAddressId
        : "preview-address-1",
    nextAddressId:
      typeof stored?.nextAddressId === "number" ? stored.nextAddressId : 3,
  };
}

export function commitAccountPreviewState(state: AccountPreviewState) {
  return accountPreviewCookie.serialize(state);
}

export function accountPreviewCustomerFromState(
  state: AccountPreviewState,
): CustomerDetailsFragment {
  return {
    firstName: state.firstName,
    lastName: state.lastName,
    phoneNumber: null,
    emailAddress: { emailAddress: "kriscommunications@co.com" },
    defaultAddress:
      state.addresses.find(
        (address) => address.id === state.defaultAddressId,
      ) ?? null,
    addresses: {
      edges: state.addresses.map((node) => ({ node })),
    },
    orders: {
      edges: [10001, 10002].map((number) => ({
        node: {
          id: `gid://shopify/Order/${number}?key=preview`,
          number,
          processedAt: "2025-09-03T00:00:00.000Z",
          financialStatus: "PENDING",
          fulfillments: { nodes: [] },
          totalPrice: { amount: "649.00", currencyCode: "USD" },
          lineItems: {
            edges: [
              {
                node: {
                  title: "Barrel Sofa",
                  image: {
                    altText: "Barrel sofa",
                    height: 933,
                    url: PREVIEW_ORDER_IMAGE,
                    width: 933,
                  },
                },
              },
              { node: { title: "Sofa cushion", image: null } },
            ],
          },
        },
      })),
    },
  };
}

export function accountPreviewOrderDetails(): OrderFragment {
  const buyDiscount = {
    code: "BUY30FF30",
    value: {
      __typename: "MoneyV2" as const,
      amount: "58.98",
      currencyCode: "USD" as const,
    },
  };
  const seasonalDiscount = {
    code: "SOFASEASON",
    value: {
      __typename: "MoneyV2" as const,
      amount: "9.98",
      currencyCode: "USD" as const,
    },
  };
  const money = (amount: string) => ({
    amount,
    currencyCode: "USD" as const,
  });
  const image = {
    altText: "Swivel barrel chair",
    height: 933,
    id: "preview-order-chair",
    url: PREVIEW_ORDER_IMAGE,
    width: 933,
  };

  return {
    id: "gid://shopify/Order/1001?key=preview",
    name: "#1001",
    statusPageUrl: "https://shopify.com",
    processedAt: "2026-09-12T00:00:00.000Z",
    fulfillments: { nodes: [] },
    totalTax: money("0.00"),
    totalPrice: money("5928.04"),
    subtotal: money("5997.00"),
    totalShipping: money("0.00"),
    shippingAddress: {
      name: "KRIS JENNER",
      formatted: ["Marina Complex", "CA 90301", "United States"],
      formattedArea: "CA 90301",
    },
    discountApplications: { nodes: [buyDiscount] },
    lineItems: {
      nodes: [
        {
          id: "preview-line-item-1",
          title: "SWIVEL BARREL CHAIR",
          quantity: 1,
          price: money("1999.00"),
          currentTotalPrice: money("1999.00"),
          totalPrice: money("1999.00"),
          discountAllocations: [
            {
              allocatedAmount: money("58.98"),
              discountApplication: buyDiscount,
            },
            {
              allocatedAmount: money("9.98"),
              discountApplication: seasonalDiscount,
            },
          ],
          totalDiscount: money("68.96"),
          image,
          variantTitle: "CREAM / XL",
        },
        {
          id: "preview-line-item-2",
          title: "SWIVEL BARREL CHAIR",
          quantity: 1,
          price: money("1999.00"),
          currentTotalPrice: money("1999.00"),
          totalPrice: money("1999.00"),
          discountAllocations: [],
          totalDiscount: money("0.00"),
          image,
          variantTitle: "CREAM / XL",
        },
        {
          id: "preview-line-item-3",
          title: "SWIVEL BARREL CHAIR",
          quantity: 1,
          price: money("1999.00"),
          currentTotalPrice: money("1999.00"),
          totalPrice: money("1999.00"),
          discountAllocations: [],
          totalDiscount: money("0.00"),
          image,
          variantTitle: "CREAM / XL",
        },
      ],
    },
  };
}

export function accountPath(locale?: string) {
  return locale ? `/${locale}/account` : "/account";
}

function cloneAddress(address: AccountPreviewAddress): AccountPreviewAddress {
  return { ...address, formatted: [...address.formatted] };
}
