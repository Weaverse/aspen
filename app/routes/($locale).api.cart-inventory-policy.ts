import { CacheShort, createWithCache } from "@shopify/hydrogen";
import { data, type LoaderFunctionArgs } from "react-router";

const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const QUERY = `query CartInventoryPolicy($ids: [ID!]!) {
  nodes(ids: $ids) { ... on ProductVariant { id inventoryPolicy inventoryItem { tracked } } }
}`;

export async function loader({ request, context }: LoaderFunctionArgs) {
  const ids = [
    ...new Set(new URL(request.url).searchParams.getAll("id")),
  ].sort();
  if (
    !ids.length ||
    ids.length > 20 ||
    ids.some((id) => !VARIANT_ID.test(id))
  ) {
    return data({ error: "Invalid variant IDs" }, { status: 400 });
  }
  if (!context.env.WEAVERSE_API_KEY) {
    return data({ error: "Inventory policy unavailable" }, { status: 503 });
  }
  const cache = createWithCache({
    cache: context.cache,
    waitUntil: context.waitUntil,
    request,
  });
  try {
    const policies = await cache.run<
      Record<string, "DENY" | "CONTINUE" | null>
    >(
      {
        cacheKey: [
          "cart-inventory-policy",
          context.env.PUBLIC_STORE_DOMAIN,
          ...ids,
        ],
        cacheStrategy: CacheShort(),
        shouldCacheResult: () => true,
      },
      async () => {
        const response = await fetch(
          "https://studio.weaverse.io/api/admin-graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${context.env.WEAVERSE_API_KEY}`,
            },
            body: JSON.stringify({ query: QUERY, variables: { ids } }),
            signal: AbortSignal.timeout(8000),
          },
        );
        if (!response.ok) {
          throw new Error("Inventory policy unavailable");
        }
        const result = (await response.json()) as {
          errors?: unknown[];
          nodes?: Array<{
            id: string;
            inventoryPolicy: string;
            inventoryItem?: { tracked: boolean };
          } | null>;
        };
        if (result.errors?.length || !result.nodes) {
          throw new Error("Inventory policy unavailable");
        }
        return Object.fromEntries(
          ids.map((id) => {
            const node = result.nodes?.find((item) => item?.id === id);
            return [
              id,
              node?.inventoryItem?.tracked === false
                ? "CONTINUE"
                : node?.inventoryPolicy === "DENY"
                  ? "DENY"
                  : node?.inventoryPolicy === "CONTINUE"
                    ? "CONTINUE"
                    : null,
            ];
          }),
        );
      },
    );
    return data({ policies });
  } catch {
    return data({ error: "Inventory policy unavailable" }, { status: 503 });
  }
}
