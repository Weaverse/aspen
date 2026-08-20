import type { LoyaltyBalance } from "~/types/loyalty";

const LOYALTYLION_API_VERSION = "2025-06";
const LOYALTYLION_API_BASE = "https://api.loyaltylion.com";

type LoyaltyLionCustomerPayload = {
  customer?: {
    points_approved?: number;
    state?: string;
  };
  points_approved?: number;
};

export function isLoyaltyLionConfigured(env: Env) {
  return Boolean(getLoyaltyLionSiteId(env) && getLoyaltyLionApiKey(env));
}

function getLoyaltyLionSiteId(env: Env) {
  return env.LOYALTYLION_SITE_ID?.trim() ?? "";
}

function getLoyaltyLionApiKey(env: Env) {
  return env.LOYALTYLION_API_KEY?.trim() ?? "";
}

function readApprovedPoints(payload: LoyaltyLionCustomerPayload) {
  const value = payload.customer?.points_approved ?? payload.points_approved;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  return null;
}

export async function fetchLoyaltyLionCustomerPoints({
  env,
  customerGid,
}: {
  env: Env;
  customerGid?: string | null;
}): Promise<LoyaltyBalance> {
  const siteId = getLoyaltyLionSiteId(env);
  const apiKey = getLoyaltyLionApiKey(env);

  if (!(siteId && apiKey)) {
    return { vendor: "none", points: null };
  }

  if (!customerGid) {
    return { vendor: "loyaltylion", points: null };
  }

  try {
    const url = `${LOYALTYLION_API_BASE}/headless/${LOYALTYLION_API_VERSION}/${encodeURIComponent(siteId)}/customers/${encodeURIComponent(customerGid)}`;
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-LoyaltyLion-Channel": "web",
      },
    });

    if (!res.ok) {
      console.error(
        `LoyaltyLion customer lookup failed with status ${res.status}`,
      );
      return { vendor: "loyaltylion", points: null };
    }

    const payload = (await res.json()) as LoyaltyLionCustomerPayload;
    return { vendor: "loyaltylion", points: readApprovedPoints(payload) };
  } catch (error) {
    console.error("LoyaltyLion customer lookup failed:", error);
    return { vendor: "loyaltylion", points: null };
  }
}
