import type { ThemivoWishlistCustomerQuery } from "customer-account-api.generated";
import type { AppLoadContext } from "react-router";
import {
  THEMIVO_CART_TRANSFER_ATTRIBUTE,
  type ThemivoItem,
  type ThemivoList,
  type WishlistApiResponse,
} from "../types/wishlist.ts";

const API = "https://wishlist-edge.themivo.com/api/v1";
const GUEST_KEY = "themivoGuest";
const RULES_TTL = 180_000;
const SNAPSHOT_TTL = 300_000;
const MAX_SNAPSHOTS = 256;
const MAX_RULE_STORES = 16;
const PRODUCT_COUNT_TTL = 30_000;
const MAX_PRODUCT_COUNTS = 512;
const PRODUCT_COUNT_WINDOW = 10_000;
// Leave room in Themivo's store quota for rules and shared wishlist reads.
const PRODUCT_COUNTS_PER_WINDOW = 40;

type Context = AppLoadContext;
type Shopper = { path: string; customer: boolean };
type Snapshot = { lists: ThemivoList[]; items: ThemivoItem[] };
type ItemPage = { items: ThemivoItem[]; nextCursor: string | null };
type Rules = { hideButton: string[]; hidePrice: string[] };

const snapshots = new Map<
  string,
  { etag: string; value: Snapshot; expires: number }
>();
const rulesCache = new Map<string, { expires: number; value: Rules }>();
const requestRules = new WeakMap<Context, Promise<Rules>>();
const retryDeadlines = new Map<string, number>();
const productCounts = new Map<string, { value: number; expires: number }>();
const productCountRequests = new Map<string, number[]>();
const storeKeys = new WeakMap<Context, Promise<string>>();
const requests = new WeakMap<
  Context,
  Promise<{
    shopper: Shopper | null;
    snapshot: Snapshot;
    rules: Rules;
  }>
>();

export class ThemivoError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfter?: string;

  constructor(code: string, status: number, retryAfter?: string) {
    super(code);
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function themivoEnabled(context: Context) {
  return Boolean(context.env.WISHLIST_API_KEY?.trim());
}

export function hasThemivoGuest(context: Context) {
  return Boolean(guestIdFromSession(context));
}

function guestIdFromSession(context: Context) {
  const id = context.session.get(GUEST_KEY);
  return typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
    ? id
    : undefined;
}

function numericId(
  value: string,
  type: "Customer" | "Product" | "ProductVariant",
) {
  const prefix = `gid://shopify/${type}/`;
  const id = value.slice(prefix.length);
  if (!value.startsWith(prefix) || !/^\d+$/.test(id)) {
    throw new ThemivoError("bad_request", 400);
  }
  return id;
}

export function productGid(id: string) {
  return `gid://shopify/Product/${id}`;
}

export function variantGid(id: string) {
  return `gid://shopify/ProductVariant/${id}`;
}

function storeKey(context: Context) {
  let key = storeKeys.get(context);
  if (!key) {
    key = crypto.subtle
      .digest(
        "SHA-256",
        new TextEncoder().encode(context.env.WISHLIST_API_KEY?.trim()),
      )
      .then((bytes) =>
        Array.from(new Uint8Array(bytes), (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join(""),
      );
    storeKeys.set(context, key);
  }
  return key;
}

async function api(
  context: Context,
  path: string,
  {
    method = "GET",
    body,
    etag,
  }: { method?: string; body?: object; etag?: string } = {},
) {
  const bucket = path.match(/^\/(?:customers|guests)\/[^/]+/)?.[0] ?? "/store";
  const rateKey = `${await storeKey(context)}${bucket}`;
  const retryAt = retryDeadlines.get(rateKey);
  if (retryAt && retryAt > Date.now()) {
    throw new ThemivoError(
      "rate_limited",
      429,
      String(Math.ceil((retryAt - Date.now()) / 1000)),
    );
  }
  retryDeadlines.delete(rateKey);
  try {
    const headers = new Headers({
      Authorization: `Bearer ${context.env.WISHLIST_API_KEY?.trim()}`,
    });
    if (body) {
      headers.set("Content-Type", "application/json");
    }
    if (etag) {
      headers.set("If-None-Match", etag);
    }
    const response = await fetch(API + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok && response.status !== 304) {
      const result = (await response.json().catch(() => null)) as {
        error?: { code?: string };
      } | null;
      let retryAfter: string | undefined;
      if (response.status === 429) {
        const seconds = Number(response.headers.get("Retry-After") ?? 10);
        const delay =
          Number.isSafeInteger(seconds) && seconds > 0 ? seconds : 10;
        retryAfter = String(delay);
        if (retryDeadlines.size >= MAX_SNAPSHOTS) {
          const oldest = retryDeadlines.keys().next().value;
          if (oldest) {
            retryDeadlines.delete(oldest);
          }
        }
        retryDeadlines.set(rateKey, Date.now() + delay * 1000);
      }
      throw new ThemivoError(
        response.status === 429
          ? "rate_limited"
          : (result?.error?.code ?? "unavailable"),
        response.status,
        retryAfter,
      );
    }
    return response;
  } catch (error) {
    if (error instanceof ThemivoError) {
      throw error;
    }
    throw new ThemivoError("unavailable", 503);
  }
}

async function shopperFor(
  context: Context,
  allowNewGuest = false,
): Promise<Shopper | null> {
  const guest = guestIdFromSession(context);
  if (await context.customerAccount.isLoggedIn()) {
    const result =
      await context.customerAccount.query<ThemivoWishlistCustomerQuery>(
        THEMIVO_CUSTOMER_QUERY,
      );
    const id = result.data?.customer?.id;
    if (!id) {
      throw new ThemivoError("unavailable", 503);
    }
    return { path: `/customers/${numericId(id, "Customer")}`, customer: true };
  }
  if (guest) {
    return { path: `/guests/${guest}`, customer: false };
  }
  if (!allowNewGuest) {
    return null;
  }
  const newGuest = crypto.randomUUID();
  context.session.set(GUEST_KEY, newGuest);
  return { path: `/guests/${newGuest}`, customer: false };
}

async function mergeGuest(context: Context, shopper: Shopper) {
  const guestId = guestIdFromSession(context);
  if (!shopper.customer || !guestId) {
    return;
  }
  const key = `${await storeKey(context)}${shopper.path}`;
  try {
    await api(context, `${shopper.path}/merge`, {
      method: "POST",
      body: { guestId },
    });
    context.session.unset(GUEST_KEY);
  } finally {
    snapshots.delete(key);
  }
}

async function getSnapshot(
  context: Context,
  shopper: Shopper,
): Promise<Snapshot> {
  const key = `${await storeKey(context)}${shopper.path}`;
  const previous = snapshots.get(key);
  const cached =
    previous && previous.expires > Date.now() ? previous : undefined;
  const response = await api(context, `${shopper.path}/wishlist`, {
    etag: cached?.etag,
  });
  if (response.status === 304 && cached) {
    return cached.value;
  }
  const value = (await response.json()) as Snapshot;
  const etag = response.headers.get("ETag");
  // A concurrent mutation or newer read may have replaced the cached snapshot.
  if (etag && snapshots.get(key) === previous) {
    snapshots.delete(key);
    if (snapshots.size >= MAX_SNAPSHOTS) {
      const oldest = snapshots.keys().next().value;
      if (oldest) {
        snapshots.delete(oldest);
      }
    }
    snapshots.set(key, { etag, value, expires: Date.now() + SNAPSHOT_TTL });
  }
  return value;
}

function readThemivoRules(context: Context) {
  let pending = requestRules.get(context);
  if (!pending) {
    pending = loadThemivoRules(context);
    requestRules.set(context, pending);
  }
  return pending;
}

async function loadThemivoRules(context: Context): Promise<Rules> {
  const key = await storeKey(context);
  const cached = rulesCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  const response = await api(context, "/rules");
  const value = (await response.json()) as Rules;
  if (!Array.isArray(value.hideButton) || !Array.isArray(value.hidePrice)) {
    throw new ThemivoError("unavailable", 503);
  }
  rulesCache.delete(key);
  if (rulesCache.size >= MAX_RULE_STORES) {
    const oldest = rulesCache.keys().next().value;
    if (oldest) {
      rulesCache.delete(oldest);
    }
  }
  rulesCache.set(key, { expires: Date.now() + RULES_TTL, value });
  return value;
}

export function readThemivoWishlist(context: Context) {
  let pending = requests.get(context);
  if (!pending) {
    pending = (async () => {
      const [shopper, rules] = await Promise.all([
        shopperFor(context),
        readThemivoRules(context),
      ]);
      if (shopper) {
        await mergeGuest(context, shopper);
      }
      const snapshot = shopper
        ? await getSnapshot(context, shopper)
        : { lists: [], items: [] };
      return { shopper, snapshot, rules };
    })();
    requests.set(context, pending);
  }
  return pending;
}

export async function readThemivoHearts(
  context: Context,
): Promise<WishlistApiResponse> {
  try {
    const { shopper, snapshot, rules } = await readThemivoWishlist(context);
    return {
      authenticated: Boolean(shopper?.customer),
      acceptsGuests: true,
      themivo: true,
      hiddenProductIds: rules.hideButton.map(productGid),
      ...wishlistSummary(snapshot),
    };
  } catch (error) {
    const rules = await readThemivoRules(context).catch(() => null);
    return {
      authenticated: false,
      acceptsGuests: true,
      themivo: true,
      hiddenProductIds: rules?.hideButton.map(productGid),
      productIds: [],
      error: themivoErrorKey(error),
    };
  }
}

function defaultWishlistId(snapshot: Snapshot) {
  return snapshot.lists.find(
    (list) =>
      list.isDefault &&
      list.role === "owner" &&
      list.kind !== "saved_for_later",
  )?.id;
}

function wishlistSummary(snapshot: Snapshot) {
  const defaultListId = defaultWishlistId(snapshot);
  const savedForLaterIds = new Set(
    snapshot.lists
      .filter((list) => list.kind === "saved_for_later")
      .map(({ id }) => id),
  );
  const defaultItems = snapshot.items.filter(
    ({ listId }) => listId === defaultListId,
  );
  return {
    savedProductCount: new Set(
      snapshot.items
        .filter(({ listId }) => !savedForLaterIds.has(listId))
        .map(({ productId, variantId }) => `${productId}:${variantId}`),
    ).size,
    savedVariantIds: [
      ...new Set(
        defaultItems.flatMap(({ variantId }) =>
          variantId ? [variantGid(variantId)] : [],
        ),
      ),
    ],
    productIds: [
      ...new Set(
        snapshot.items
          .filter(
            (item) => item.listId === defaultListId && item.variantId === "",
          )
          .map(({ productId }) => productGid(productId)),
      ),
    ],
  };
}

export function themivoErrorKey(error: unknown) {
  if (error instanceof ThemivoError) {
    switch (error.code) {
      case "login_required":
        return "wishlist.loginRequired";
      case "feature_disabled":
        return "wishlist.featureDisabled";
      case "forbidden":
        return "wishlist.forbidden";
      case "rate_limited":
        return "wishlist.rateLimited";
      case "limit_reached":
        return "errors.wishlistLimit";
      case "not_found":
        return "wishlist.notFound";
      case "cart_line_unsupported":
        return "wishlist.cartLineUnsupported";
      case "cart_item_already_saved":
        return "wishlist.cartItemAlreadySaved";
      case "cart_transfer_incomplete":
        return "wishlist.cartTransferIncomplete";
      case "bad_request":
        return "errors.wishlistInvalidRequest";
      default:
        return "errors.wishlistUnavailable";
    }
  }
  return "errors.wishlistUnavailable";
}

export function checkThemivoPost(request: Request) {
  if (
    request.method !== "POST" ||
    request.headers.get("Origin") !== new URL(request.url).origin
  ) {
    throw new ThemivoError("forbidden", 403);
  }
}

export async function toggleThemivoHeart(
  context: Context,
  productId: string,
  intent: "add" | "remove",
  variantId?: string,
) {
  const variant = variantId ? numericId(variantId, "ProductVariant") : "";
  const shopper = await shopperFor(context, intent === "add");
  if (!shopper) {
    return {
      authenticated: false,
      acceptsGuests: true,
      productIds: [],
      savedProductCount: 0,
      savedVariantIds: [],
    };
  }
  await mergeGuest(context, shopper);
  const product = numericId(productId, "Product");
  if (intent === "remove") {
    const snapshot = await getSnapshot(context, shopper);
    const listId = defaultWishlistId(snapshot);
    if (!listId) {
      return {
        authenticated: shopper.customer,
        acceptsGuests: true,
        ...wishlistSummary(snapshot),
      };
    }
    const result = (await mutate(context, shopper, "/items", {
      method: "DELETE",
      body: { productId: product, listId, variantId: variant },
    })) as { state: Snapshot };
    productCounts.delete(`${await storeKey(context)}:${product}`);
    return {
      authenticated: shopper.customer,
      acceptsGuests: true,
      ...wishlistSummary(result.state),
    };
  }
  const result = (await mutate(context, shopper, "/items", {
    method: "POST",
    body: { productId: product, ...(variant && { variantId: variant }) },
  })) as { state: Snapshot };
  productCounts.delete(`${await storeKey(context)}:${product}`);
  return {
    authenticated: shopper.customer,
    acceptsGuests: true,
    ...wishlistSummary(result.state),
  };
}

export async function readThemivoProductCount(
  context: Context,
  productId: string,
) {
  const product = numericId(productId, "Product");
  if (!/^[1-9]\d{0,19}$/.test(product)) {
    throw new ThemivoError("bad_request", 400);
  }
  const store = await storeKey(context);
  const key = `${store}:${product}`;
  const now = Date.now();
  const cached = productCounts.get(key);
  if (cached && cached.expires > now) {
    return cached.value;
  }
  const recent = (productCountRequests.get(store) ?? []).filter(
    (time) => time > now - PRODUCT_COUNT_WINDOW,
  );
  if (recent.length >= PRODUCT_COUNTS_PER_WINDOW) {
    return null;
  }
  if (
    !productCountRequests.has(store) &&
    productCountRequests.size >= MAX_RULE_STORES
  ) {
    const oldest = productCountRequests.keys().next().value;
    if (oldest) {
      productCountRequests.delete(oldest);
    }
  }
  productCountRequests.set(store, [...recent, now]);
  const response = await api(context, `/products/${product}/stats`);
  const { count } = (await response.json()) as { count?: number };
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
    return null;
  }
  productCounts.delete(key);
  if (productCounts.size >= MAX_PRODUCT_COUNTS) {
    const oldest = productCounts.keys().next().value;
    if (oldest) {
      productCounts.delete(oldest);
    }
  }
  productCounts.set(key, {
    value: count,
    expires: Date.now() + PRODUCT_COUNT_TTL,
  });
  return count;
}

async function mutate(
  context: Context,
  shopper: Shopper,
  path: string,
  options: { method: string; body?: object },
) {
  const key = `${await storeKey(context)}${shopper.path}`;
  try {
    const response = await api(context, shopper.path + path, options);
    return response.status === 204 ? null : await response.json();
  } finally {
    snapshots.delete(key);
    requests.delete(context);
  }
}

function identifier(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,256}$/.test(value)) {
    throw new ThemivoError("bad_request", 400);
  }
  return encodeURIComponent(value);
}

export async function changeThemivoList(context: Context, form: FormData) {
  const intent = form.get("intent");
  const shopper = await shopperFor(context);
  if (
    !shopper ||
    (!shopper.customer &&
      (intent === "create" ||
        intent === "invite" ||
        intent === "accept" ||
        intent === "leave"))
  ) {
    throw new ThemivoError("login_required", 401);
  }
  await mergeGuest(context, shopper);
  const list =
    intent === "create" || intent === "accept"
      ? ""
      : identifier(form.get("listId"));
  const path = `/lists/${list}`;
  switch (intent) {
    case "create":
    case "rename": {
      const name = String(form.get("name") ?? "").trim();
      if (!name || name.length > 80) {
        throw new ThemivoError("bad_request", 400);
      }
      await mutate(context, shopper, intent === "create" ? "/lists" : path, {
        method: intent === "create" ? "POST" : "PATCH",
        body: { name },
      });
      return {};
    }
    case "delete":
      await mutate(context, shopper, path, { method: "DELETE" });
      return {};
    case "move":
    case "remove": {
      const item = {
        productId: numericId(String(form.get("productId")), "Product"),
        variantId: form.get("variantId")
          ? numericId(String(form.get("variantId")), "ProductVariant")
          : "",
      };
      if (intent === "move") {
        await mutate(context, shopper, "/items/move", {
          method: "POST",
          body: {
            ...item,
            fromListId: list,
            toListId: identifier(form.get("toListId")),
          },
        });
      } else {
        await mutate(context, shopper, "/items", {
          method: "DELETE",
          body: { ...item, listId: list },
        });
      }
      return {};
    }
    case "share": {
      const result = (await mutate(context, shopper, `${path}/share`, {
        method: "POST",
      })) as { token: string };
      return { shareToken: identifier(result.token), listId: list };
    }
    case "revoke":
      await mutate(context, shopper, `${path}/share`, { method: "DELETE" });
      return {};
    case "invite": {
      const result = (await mutate(context, shopper, `${path}/invites`, {
        method: "POST",
      })) as { token: string };
      return { inviteToken: identifier(result.token), listId: list };
    }
    case "accept":
      await mutate(
        context,
        shopper,
        `/invites/${identifier(form.get("token"))}/accept`,
        { method: "POST" },
      );
      return {};
    case "leave":
      await mutate(context, shopper, `${path}/leave`, { method: "POST" });
      return {};
    default:
      throw new ThemivoError("bad_request", 400);
  }
}

export async function readThemivoList(
  context: Context,
  listId: string,
  cursor: string | null,
) {
  const { shopper, snapshot, rules } = await readThemivoWishlist(context);
  const list = snapshot.lists.find(({ id }) => id === listId);
  if (!shopper || !list) {
    throw new ThemivoError("not_found", 404);
  }
  const query = new URLSearchParams({ limit: "24" });
  if (cursor) {
    query.set("cursor", cursor);
  }
  const response = await api(
    context,
    `${shopper.path}/lists/${identifier(listId)}/items?${query}`,
  );
  return { page: (await response.json()) as ItemPage, rules };
}

export async function readThemivoShared(
  context: Context,
  token: string,
  cursor: string | null,
) {
  const query = new URLSearchParams({ limit: "24" });
  if (cursor) {
    query.set("cursor", cursor);
  }
  const [response, rules] = await Promise.all([
    api(context, `/shared/${identifier(token)}?${query}`),
    readThemivoRules(context),
  ]);
  const shared = (await response.json()) as {
    list: { name: string };
    items: ItemPage;
  };
  return { name: shared.list.name, page: shared.items, rules };
}

const THEMIVO_CUSTOMER_QUERY = `#graphql
  query ThemivoWishlistCustomer {
    customer { id }
  }
`;

type SavedCartList = ThemivoList & { items: ThemivoItem[] };
const PENDING_CART_SAVE = "themivoPendingCartSave";
const MAX_PENDING_CART_SAVES = 12;
const CART_SAVE_RETRY_TTL = 24 * 60 * 60 * 1000;
const cartTransfers = new Map<string, Promise<unknown>>();

async function cartSaveFingerprint(transferId: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(transferId),
  );
  return btoa(String.fromCharCode(...new Uint8Array(hash, 0, 16)));
}

async function savedCartList(context: Context, shopper: Shopper) {
  const response = await api(context, `${shopper.path}/lists`);
  const { lists } = (await response.json()) as { lists: SavedCartList[] };
  return lists.find(
    (list) => list.kind === "saved_for_later" && list.role === "owner",
  );
}

export async function readThemivoSavedCart(context: Context) {
  const shopper = await shopperFor(context);
  if (!shopper) {
    return { items: [], hiddenPrices: [] };
  }
  await mergeGuest(context, shopper);
  const [list, rules] = await Promise.all([
    savedCartList(context, shopper),
    readThemivoRules(context),
  ]);
  return { items: list?.items ?? [], hiddenPrices: rules.hidePrice };
}

export async function transferThemivoCartItem(
  context: Context,
  intent: "save" | "restore" | "discard",
  form: FormData,
  listName = "Saved for later",
): Promise<{
  cart: Awaited<ReturnType<Context["cart"]["get"]>>;
  wishlistError?: string;
}> {
  const shopper = await shopperFor(context, intent === "save");
  if (!shopper) {
    throw new ThemivoError("login_required", 401);
  }

  // Serialize overlapping transfers for this shopper in the same worker.
  const key = `${await storeKey(context)}${shopper.path}`;
  const previous = cartTransfers.get(key);
  const transfer = (previous ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      await mergeGuest(context, shopper);
      return intent === "save"
        ? saveCartItem(context, shopper, form.get("lineId"), listName)
        : restoreCartItem(context, shopper, form, intent === "discard");
    });
  cartTransfers.set(key, transfer);
  try {
    return await transfer;
  } finally {
    if (cartTransfers.get(key) === transfer) {
      cartTransfers.delete(key);
    }
  }
}

async function saveCartItem(
  context: Context,
  shopper: Shopper,
  lineId: FormDataEntryValue | null,
  listName: string,
) {
  const { cart, session } = context;
  const current = await cart.get();
  const line = current?.lines?.nodes?.find(({ id }) => id === lineId);
  if (!line) {
    throw new ThemivoError("not_found", 404);
  }
  const productId = numericId(line.merchandise.product.id, "Product");
  const variantId = numericId(line.merchandise.id, "ProductVariant");
  const quantity = line.quantity;
  if (
    line.sellingPlanAllocation ||
    line.attributes?.some(
      ({ key }) => key !== THEMIVO_CART_TRANSFER_ATTRIBUTE,
    ) ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 999
  ) {
    throw new ThemivoError("cart_line_unsupported", 400);
  }

  const [saved, rules] = await Promise.all([
    savedCartList(context, shopper),
    readThemivoRules(context),
  ]);
  if (rules.hideButton.includes(productId)) {
    throw new ThemivoError("forbidden", 403);
  }
  const listId =
    saved?.id ??
    (
      (await mutate(context, shopper, "/lists", {
        method: "POST",
        body: { name: listName.slice(0, 80), kind: "saved_for_later" },
      })) as { listId: string }
    ).listId;
  if (typeof listId !== "string" || !listId) {
    throw new ThemivoError("unavailable", 503);
  }
  const transferId = JSON.stringify([shopper.path, line.id, listId, quantity]);
  const fingerprint = await cartSaveFingerprint(transferId);
  // Keep each unfinished line recoverable without growing the session cookie indefinitely.
  const previous = session.get(PENDING_CART_SAVE) as
    | Record<string, number>
    | string
    | undefined;
  const now = Date.now();
  const pending =
    typeof previous === "string"
      ? { [await cartSaveFingerprint(previous)]: now + CART_SAVE_RETRY_TTL }
      : Object.fromEntries(
          Object.entries(previous ?? {}).filter(([, expires]) => expires > now),
        );
  const existing = saved?.items.find(
    (item) => item.productId === productId && item.variantId === variantId,
  );
  if (existing) {
    if (!pending[fingerprint] || existing.quantity !== quantity) {
      throw new ThemivoError("cart_item_already_saved", 409);
    }
  } else {
    if (
      !pending[fingerprint] &&
      Object.keys(pending).length >= MAX_PENDING_CART_SAVES
    ) {
      throw new ThemivoError("cart_transfer_incomplete", 409);
    }
    const result = (await mutate(context, shopper, "/items", {
      method: "POST",
      body: { listId, productId, variantId, quantity },
    })) as { changed: boolean };
    if (!result.changed) {
      throw new ThemivoError("cart_item_already_saved", 409);
    }
    pending[fingerprint] = now + CART_SAVE_RETRY_TTL;
    session.set(PENDING_CART_SAVE, pending);
  }

  const latest = await cart.get();
  const currentLine = latest?.lines?.nodes?.find(({ id }) => id === line.id);
  if (!latest || (currentLine && currentLine.quantity !== quantity)) {
    throw new ThemivoError("cart_transfer_incomplete", 409);
  }
  let updated = latest;
  if (currentLine) {
    const result = await cart.removeLines([line.id]);
    if (
      result.errors?.length ||
      result.userErrors?.length ||
      !result.cart ||
      result.cart.lines?.nodes?.some(({ id }) => id === line.id)
    ) {
      throw new ThemivoError("cart_transfer_incomplete", 409);
    }
    updated = result.cart;
  }
  delete pending[fingerprint];
  if (Object.keys(pending).length) {
    session.set(PENDING_CART_SAVE, pending);
  } else {
    session.unset(PENDING_CART_SAVE);
  }
  return { cart: updated };
}

async function restoreCartItem(
  context: Context,
  shopper: Shopper,
  form: FormData,
  discard: boolean,
) {
  const productId = numericId(String(form.get("productId") ?? ""), "Product");
  const variant = String(form.get("variantId") ?? "");
  const variantId = variant ? numericId(variant, "ProductVariant") : "";
  const saved = await savedCartList(context, shopper);
  const item = saved?.items.find(
    (entry) => entry.productId === productId && entry.variantId === variantId,
  );
  if (!saved || !item) {
    throw new ThemivoError("not_found", 404);
  }
  const remove = () =>
    mutate(context, shopper, "/items", {
      method: "DELETE",
      body: { listId: saved.id, productId, variantId },
    });
  if (discard) {
    await remove();
    return { cart: null };
  }
  if (
    !variantId ||
    !Number.isSafeInteger(item.addedAt) ||
    !Number.isInteger(item.quantity) ||
    !item.quantity ||
    item.quantity < 1
  ) {
    throw new ThemivoError("not_found", 404);
  }

  const { cart } = context;
  const marker = JSON.stringify([saved.id, productId, variantId, item.addedAt]);
  const current = await cart.get();
  const findTransferredLine = (cartData: typeof current) =>
    cartData?.lines?.nodes?.find(({ attributes }) =>
      attributes?.some(
        ({ key, value }) =>
          key === THEMIVO_CART_TRANSFER_ATTRIBUTE && value === marker,
      ),
    );
  const alreadyAdded = findTransferredLine(current);
  const incomplete = (cartData: typeof current) => ({
    cart: cartData,
    wishlistError: "wishlist.cartTransferIncomplete",
  });
  if (alreadyAdded && alreadyAdded.quantity > item.quantity) {
    return incomplete(current);
  }
  let updated = current;
  if (alreadyAdded?.quantity !== item.quantity) {
    // Set the marked line to the saved total so retries never add the partial quantity twice.
    const result = alreadyAdded
      ? await cart.updateLines([
          { id: alreadyAdded.id, quantity: item.quantity },
        ])
      : await cart.addLines([
          {
            merchandiseId: variantGid(variantId),
            quantity: item.quantity,
            attributes: [
              { key: THEMIVO_CART_TRANSFER_ATTRIBUTE, value: marker },
            ],
          },
        ]);
    updated = result.cart ?? current;
    if (
      result.errors?.length ||
      result.userErrors?.length ||
      findTransferredLine(updated)?.quantity !== item.quantity
    ) {
      return incomplete(updated);
    }
  }
  try {
    await remove();
  } catch {
    return incomplete(updated);
  }
  return { cart: updated };
}
