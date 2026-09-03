import {
  Analytics,
  CartForm,
  type CartQueryDataReturn,
} from "@shopify/hydrogen";
import type {
  CartBuyerIdentityInput,
  CartLineInput,
  CartLineUpdateInput,
} from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import {
  type ActionFunctionArgs,
  type AppLoadContext,
  Await,
  data,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
  useRouteLoaderData,
} from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import invariant from "tiny-invariant";
import { Cart } from "~/components/cart/cart";
import { CART_CODE_APPLY_ACTION } from "~/components/cart/cart-actions";
import { CartBestSellers } from "~/components/cart/cart-best-sellers";
import { useCartState } from "~/components/cart/cart-state-provider";
import { Section } from "~/components/section";
import type { RootLoader } from "~/root";
import { CART_ERROR_KEYS } from "~/utils/cart-error";
import { getLocalizedMeta } from "~/utils/metadata";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export const meta: MetaFunction = ({ params }) =>
  getLocalizedMeta({ locale: params.locale, page: "cart" });

export async function action({ request, context }: ActionFunctionArgs) {
  const { cart } = context;
  const formData = await request.formData();
  const { action: parsedAction, inputs } = CartForm.getFormInput(formData);
  const cartFormAction = parsedAction as string;
  invariant(cartFormAction, "No cartAction defined");

  const status = 200;
  let result: CartQueryDataReturn;
  let cartCodeApplied: boolean | undefined;

  switch (cartFormAction) {
    case CART_CODE_APPLY_ACTION: {
      const code = String(inputs.discountCode ?? "").trim();
      invariant(code, "No cart code provided");

      const currentCart = await cart.get();
      const currentDiscountCodes =
        currentCart?.discountCodes?.map(
          ({ code: discountCode }) => discountCode,
        ) ?? [];
      const currentGiftCardIds = new Set(
        currentCart?.appliedGiftCards?.map((giftCard) => giftCard.id) ?? [],
      );

      const discountResult = await cart.updateDiscountCodes([
        ...currentDiscountCodes,
        code,
      ]);
      const discountApplied = discountResult.cart?.discountCodes?.some(
        (discount) =>
          discount.code.toLowerCase() === code.toLowerCase() &&
          discount.applicable,
      );

      if (discountApplied) {
        result = discountResult;
        cartCodeApplied = true;
      } else {
        await cart.updateDiscountCodes(currentDiscountCodes);
        result = await cart.addGiftCardCodes([code]);
        const normalizedCode = code.replace(/\s/g, "").toLowerCase();
        cartCodeApplied = Boolean(
          result.cart?.appliedGiftCards?.some(
            (giftCard) =>
              !currentGiftCardIds.has(giftCard.id) &&
              normalizedCode.endsWith(giftCard.lastCharacters.toLowerCase()),
          ),
        );
      }
      break;
    }
    case CartForm.ACTIONS.LinesAdd: {
      const lines = (inputs.lines as CartLineInput[] | undefined) ?? [];
      const hasInvalidLine =
        lines.length === 0 ||
        lines.some(
          (line) =>
            typeof line.merchandiseId !== "string" ||
            line.merchandiseId.length === 0 ||
            !Number.isInteger(line.quantity) ||
            Number(line.quantity) <= 0,
        );

      if (hasInvalidLine) {
        return data(
          {
            cart: undefined,
            userErrors: [
              {
                message: CART_ERROR_KEYS.selectAvailableOption,
              },
            ],
            errors: undefined,
            cartCodeApplied: undefined,
          },
          { status: 400 },
        );
      }

      result = await cart.addLines(lines);
      break;
    }
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines as CartLineUpdateInput[]);
      break;
    case CartForm.ACTIONS.LinesRemove: {
      const requestedLineIds = Array.isArray(inputs.lineIds)
        ? inputs.lineIds.filter(
            (lineId): lineId is string =>
              typeof lineId === "string" && lineId.length > 0,
          )
        : [];

      if (!requestedLineIds.length) {
        const currentCart = await getCartOrNull(cart);
        return data(
          {
            cart: currentCart,
            userErrors: [{ message: CART_ERROR_KEYS.noLineSelected }],
            errors: undefined,
            cartCodeApplied: undefined,
          },
          { status: 400 },
        );
      }

      const currentCart = await getCartOrNull(cart);
      const currentLineIds = new Set(
        currentCart?.lines?.nodes?.map((line) => line.id) ?? [],
      );
      const existingLineIds = requestedLineIds.filter((lineId) =>
        currentLineIds.has(lineId),
      );

      // A repeated remove request has already reached its desired state.
      if (!existingLineIds.length) {
        return data({
          cart: currentCart,
          userErrors: [],
          errors: undefined,
          cartCodeApplied: undefined,
        });
      }

      try {
        const removeResult = await cart.removeLines(existingLineIds);
        if (hasOnlyMissingCartLineErrors(removeResult)) {
          return data({
            cart: (await getCartOrNull(cart)) ?? removeResult.cart,
            userErrors: [],
            errors: undefined,
            cartCodeApplied: undefined,
          });
        }
        result = removeResult;
      } catch (error) {
        if (!isMissingCartLineError(error)) {
          throw error;
        }
        return data({
          cart: await getCartOrNull(cart),
          userErrors: [],
          errors: undefined,
          cartCodeApplied: undefined,
        });
      }
      break;
    }
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...(inputs.discountCodes as string[]));

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd:
      result = await cart.addGiftCardCodes(inputs.giftCardCodes as string[]);
      break;
    case CartForm.ACTIONS.GiftCardCodesRemove:
      result = await cart.removeGiftCardCodes(
        inputs.appliedGiftCardIds as string[],
      );
      break;
    case CartForm.ACTIONS.NoteUpdate:
      result = await cart.updateNote(String(inputs.note ?? ""));
      break;
    case CartForm.ACTIONS.BuyerIdentityUpdate:
      result = await cart.updateBuyerIdentity({
        ...(inputs.buyerIdentity as CartBuyerIdentityInput),
      });
      break;
    default:
      invariant(false, `${cartFormAction} cart action is not defined`);
  }

  /**
   * The Cart ID may change after each mutation. We need to update it each time in the session.
   */
  const headers = result.cart ? cart.setCartId(result.cart.id) : new Headers();

  const redirectTo = formData.get("redirectTo") ?? null;
  if (typeof redirectTo === "string" && isLocalPath(redirectTo)) {
    return redirect(redirectTo, { headers });
  }

  const { cart: cartResult, errors, userErrors } = result;

  return data(
    {
      cart: cartResult,
      userErrors,
      errors,
      cartCodeApplied,
    },
    { status, headers },
  );
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { cart } = context;
  return await getCartOrNull(cart);
}

export default function CartRoute() {
  const { t } = useTranslation();
  const rootData = useRouteLoaderData<RootLoader>("root");
  const { cart: latestCart, isResolved } = useCartState();
  if (!rootData) {
    return null;
  }

  return (
    <>
      <Section
        width="fixed"
        gap={32}
        className="bg-[#EDEDED] pt-10 pb-20"
        containerClassName="!max-w-[1360px]"
      >
        <h4 className="text-left font-normal uppercase">{t("cart.title")}</h4>
        <Await resolve={isResolved ? latestCart : rootData?.cart}>
          {(cart) => <Cart layout="page" cart={cart as CartApiQueryFragment} />}
        </Await>
      </Section>
      <Section
        width="fixed"
        className="bg-white py-16 md:py-20"
        containerClassName="!max-w-[1360px]"
      >
        <CartBestSellers
          count={6}
          heading={t("cart.recommendations")}
          layout="page"
          sortKey="BEST_SELLING"
        />
      </Section>
      <Analytics.CartView />
    </>
  );
}

/**
 * Validates that a url is local
 * @param url
 * @returns `true` if local `false`if external domain
 */
export function isLocalPath(url: string) {
  try {
    // We don't want to redirect cross domain,
    // doing so could create fishing vulnerability
    // If `new URL()` succeeds, it's a fully qualified
    // url which is cross domain. If it fails, it's just
    // a path, which will be the current domain.
    new URL(url);
  } catch (e) {
    return true;
  }

  return false;
}

function hasOnlyMissingCartLineErrors(result: CartQueryDataReturn) {
  const messages = [
    ...(result.userErrors ?? []).map((error) => error.message),
    ...getErrorMessages(result.errors),
  ].filter(Boolean);

  return messages.length > 0 && messages.every(isMissingCartLineError);
}

function isMissingCartLineError(error: unknown) {
  return getErrorMessages(error).some((message) =>
    /merchandise line with id .+ does not exist/i.test(message),
  );
}

function getErrorMessages(error: unknown): string[] {
  if (typeof error === "string") {
    return [error];
  }
  if (Array.isArray(error)) {
    return error.flatMap(getErrorMessages);
  }
  if (error instanceof Error) {
    return [error.message];
  }
  if (error && typeof error === "object" && "message" in error) {
    return getErrorMessages((error as { message?: unknown }).message);
  }
  return [];
}

async function getCartOrNull(cart: AppLoadContext["cart"]) {
  try {
    return await cart.get();
  } catch (error) {
    if (isMissingCartLineError(error)) {
      return null;
    }
    throw error;
  }
}
