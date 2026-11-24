import { gql } from "@shopify/hydrogen/customer-account";
import type { WeaverseLoaderData } from "@weaverse/hydrogen/react-router";
import {
  data,
  type LoaderFunctionArgs,
  Outlet,
  useLoaderData,
  useMatches,
  useOutlet,
} from "react-router";
import { OutletModal } from "~/components/customer/outlet-modal";
import type {
  CustomerDetailsFragment,
  CustomerDetailsQuery,
} from "~/graphql/customer-types";
import AccountSection from "~/sections/account";
import AccountAddressBookBlock from "~/sections/account/address-book";
import AccountDetailsBlock from "~/sections/account/details";
import AccountOrders from "~/sections/account/orders";
import {
  accountPreviewCustomerFromState,
  isAccountPreviewRequest,
  readAccountPreviewState,
} from "~/utils/account-preview.server";
import {
  CacheNone,
  generateCacheControlHeader,
  routeHeaders,
} from "~/utils/cache";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { WeaverseContent } from "~/weaverse";
import { doLogout } from "./($locale).account_.logout";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({ context, request }: LoaderFunctionArgs) {
  const weaverseData = await context.weaverse.loadPage({
    type: "CUSTOM",
    handle: "account",
  });
  const isDesignMode = Boolean(
    weaverseData?.configs?.requestInfo?.queries?.isDesignMode,
  );
  const isLocalPreview = isAccountPreviewRequest(request);

  // Keep the account page editable in Studio and previewable on HTTP localhost.
  // HTTPS local development, tunnels and production use the real customer.
  if (isDesignMode || isLocalPreview) {
    const previewState = await readAccountPreviewState(request);
    return data(
      {
        customer: accountPreviewCustomerFromState(previewState),
        weaverseData,
      },
      { headers: { "Cache-Control": generateCacheControlHeader(CacheNone()) } },
    );
  }

  const { data: d, errors } = await context.customerAccount.graphql(
    CUSTOMER_DETAILS_QUERY,
  );

  /**
   * If the customer failed to load, we assume their access token is invalid.
   */
  if (errors?.length || !d?.customer) {
    throw await doLogout(context);
  }

  const customer = d?.customer;

  return data(
    { customer, weaverseData },
    { headers: { "Cache-Control": generateCacheControlHeader(CacheNone()) } },
  );
}

export default function Authenticated() {
  const loaderData = useLoaderData<typeof loader>();
  const outlet = useOutlet();
  const matches = useMatches();

  // routes that export handle { renderInModal: true }
  const renderInModal = matches.find(
    (match: { handle?: { renderInModal?: boolean } }) => {
      const handle = match?.handle;
      return handle?.renderInModal;
    },
  );

  if (outlet) {
    if (renderInModal) {
      return (
        <>
          <OutletModal cancelLink="/account">
            <Outlet context={{ customer: loaderData.customer }} />
          </OutletModal>
          <Account {...loaderData} customer={loaderData.customer} />
        </>
      );
    }
    return <Outlet context={{ customer: loaderData.customer }} />;
  }

  return <Account {...loaderData} customer={loaderData.customer} />;
}

interface AccountType {
  customer: CustomerDetailsFragment;
  weaverseData: WeaverseLoaderData | null;
}

function Account({ customer, weaverseData }: AccountType) {
  const isDesignMode = Boolean(
    weaverseData?.configs?.requestInfo?.queries?.isDesignMode,
  );
  const hasAccountSection = Boolean(
    weaverseData?.page?.items?.some((item) => item.type === "account"),
  );

  // Studio must always render the Weaverse tree so merchants can insert the
  // Account preset. On the storefront, fall back to the built-in preset until
  // the custom account page actually contains an Account section.
  if (isDesignMode || hasAccountSection) {
    return <WeaverseContent />;
  }

  return (
    <AccountSection customer={customer}>
      <AccountOrders />
      <AccountDetailsBlock />
      <AccountAddressBookBlock />
    </AccountSection>
  );
}

// NOTE: https://shopify.dev/docs/api/customer/latest/queries/customer
export const CUSTOMER_DETAILS_QUERY_OrderCard =
  gql(`fragment OrderCard on Order {
  id
  number
  processedAt
  financialStatus
  fulfillments(first: 1) {
    nodes {
      status
    }
  }
  totalPrice {
    amount
    currencyCode
  }
  lineItems(first: 2) {
    edges {
      node {
        title
        image {
          altText
          height
          url
          width
        }
      }
    }
  }
}`);

export const CUSTOMER_DETAILS_QUERY_AddressPartial =
  gql(`fragment AddressPartial on CustomerAddress {
  id
  formatted
  firstName
  lastName
  company
  address1
  address2
  countryCode
  zoneCode
  city
  zip
  phoneNumber
}`);

export const CUSTOMER_DETAILS_QUERY_CustomerDetails =
  gql(`fragment CustomerDetails on Customer {
  firstName
  lastName
  phoneNumber {
    phoneNumber
  }
  emailAddress {
    emailAddress
  }
  defaultAddress {
    ...AddressPartial
  }
  addresses(first: 6) {
    edges {
      node {
        ...AddressPartial
      }
    }
  }
  orders(first: 250, sortKey: PROCESSED_AT, reverse: true) {
    edges {
      node {
        ...OrderCard
      }
    }
  }
}

fragment AddressPartial on CustomerAddress {
  id
  formatted
  firstName
  lastName
  company
  address1
  address2
  countryCode
  zoneCode
  city
  zip
  phoneNumber
}

fragment OrderCard on Order {
  id
  number
  processedAt
  financialStatus
  fulfillments(first: 1) {
    nodes {
      status
    }
  }
  totalPrice {
    amount
    currencyCode
  }
  lineItems(first: 2) {
    edges {
      node {
        title
        image {
          altText
          height
          url
          width
        }
      }
    }
  }
}`);

export const CUSTOMER_DETAILS_QUERY = gql(`query CustomerDetails {
  customer {
    ...CustomerDetails
  }
}

fragment CustomerDetails on Customer {
  firstName
  lastName
  phoneNumber {
    phoneNumber
  }
  emailAddress {
    emailAddress
  }
  defaultAddress {
    ...AddressPartial
  }
  addresses(first: 6) {
    edges {
      node {
        ...AddressPartial
      }
    }
  }
  orders(first: 250, sortKey: PROCESSED_AT, reverse: true) {
    edges {
      node {
        ...OrderCard
      }
    }
  }
}

fragment AddressPartial on CustomerAddress {
  id
  formatted
  firstName
  lastName
  company
  address1
  address2
  countryCode
  zoneCode
  city
  zip
  phoneNumber
}

fragment OrderCard on Order {
  id
  number
  processedAt
  financialStatus
  fulfillments(first: 1) {
    nodes {
      status
    }
  }
  totalPrice {
    amount
    currencyCode
  }
  lineItems(first: 2) {
    edges {
      node {
        title
        image {
          altText
          height
          url
          width
        }
      }
    }
  }
}`);
