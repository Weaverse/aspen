import { gql } from "@shopify/hydrogen/customer-account";
import type { CustomerAccount } from "~/.server/customer-account";
import type { LoyaltyBalance } from "~/types/loyalty";
import {
  fetchLoyaltyLionCustomerPoints,
  isLoyaltyLionConfigured,
} from "~/utils/loyaltylion.server";

type LoyaltyCustomerQuery = {
  customer?: {
    id: string;
    emailAddress?: { emailAddress?: string | null } | null;
  } | null;
};

export const LOYALTY_CUSTOMER_QUERY = gql(`query LoyaltyCustomer {
  customer {
    id
    emailAddress {
      emailAddress
    }
  }
}`);

export async function loadLoyaltyBalance({
  env,
  customerAccount,
  isLoggedIn,
}: {
  env: Env;
  customerAccount: CustomerAccount;
  isLoggedIn: Promise<boolean>;
}): Promise<LoyaltyBalance> {
  if (!isLoyaltyLionConfigured(env)) {
    return { vendor: "none", points: null };
  }

  if (!(await isLoggedIn)) {
    return { vendor: "loyaltylion", points: null };
  }

  try {
    const { data, errors } = await customerAccount.graphql(
      LOYALTY_CUSTOMER_QUERY,
    );

    if (errors?.length || !data?.customer?.id) {
      return { vendor: "loyaltylion", points: null };
    }

    return fetchLoyaltyLionCustomerPoints({
      env,
      customerGid: data.customer.id,
    });
  } catch (error) {
    console.error("Loyalty customer lookup failed:", error);
    return { vendor: "loyaltylion", points: null };
  }
}
