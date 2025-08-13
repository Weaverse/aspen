import { CaretDown, TrashIcon, X } from "@phosphor-icons/react";
import {
  CartForm,
  Money,
  type OptimisticCart,
  OptimisticInput,
  useOptimisticCart,
  useOptimisticData,
} from "@shopify/hydrogen";
import type { Cart as CartType } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import useScroll from "react-use/esm/useScroll";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { RevealUnderline } from "~/reveal-underline";
import { getImageAspectRatio } from "~/utils/image";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { CartBestSellers } from "./cart-best-sellers";
import { useThemeSettings } from "@weaverse/hydrogen";

type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];
type Layouts = "page" | "drawer";

export function Cart({
  layout,
  onClose,
  cart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: CartApiQueryFragment;
}) {
  const optimisticCart = useOptimisticCart<CartApiQueryFragment>(cart);
  const linesCount = Boolean(optimisticCart?.lines?.nodes?.length || 0);
  const cartHasItems = !!cart && cart.totalQuantity > 0;

  if (cartHasItems) {
    return <CartDetails cart={optimisticCart} layout={layout} />;
  }
  return <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />;
}

function CartDetails({
  layout,
  cart,
}: {
  layout: Layouts;
  cart: OptimisticCart<CartApiQueryFragment>;
}) {
  let { enableFreeShipping } = useThemeSettings();
  return (
    <>
      {layout === "drawer" && enableFreeShipping && (
        <CartProgression cost={cart.cost} />
      )}
      <div
        className={clsx(
          layout === "drawer" && [
            "grid grid-cols-1 grid-rows-[1fr_auto] px-4 pt-6",
            enableFreeShipping ? "h-[calc(100vh-100px)]" : "h-[100vh]",
          ],
          layout === "page" && ["flex lg:gap-5 gap-10"],
        )}
      >
        <div
          className={clsx(
            layout === "drawer"
              ? `overflow-y-auto max-h-full pr-3 ${
                  enableFreeShipping ? "pb-5" : "pb-16"
                }`
              : "lg:w-2/3 w-full",
          )}
        >
          <CartLines lines={cart?.lines?.nodes} layout={layout} />
        </div>
        <CartSummary cost={cart.cost} layout={layout}>
          <CartDiscounts discountCodes={cart.discountCodes} />
          {layout === "page" && (
            <div className="border-y border-line-subtle py-6 flex flex-col gap-6">
              <div className="flex items-center justify-between font-medium">
                <span className="font-normal">Subtotal</span>
                <span className="font-normal">
                  {cart?.cost?.subtotalAmount?.amount ? (
                    <Money data={cart?.cost?.subtotalAmount} />
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              <span className="font-normal text-[#918379]">
                Shipping & taxes calculated at checkout
              </span>
            </div>
          )}
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} layout={layout} />
        </CartSummary>
      </div>
    </>
  );
}

function CartProgression({ cost }: { cost: CartApiQueryFragment["cost"] }) {
  let { freeShippingThreshold } = useThemeSettings();

  let subtotal = parseFloat(cost?.subtotalAmount?.amount || "0");
  let threshold = parseFloat(freeShippingThreshold || "100");
  let progress = Math.min((subtotal / threshold) * 100, 100);
  let amountRemaining = Math.max(threshold - subtotal, 0);
  return (
    <div className="w-full rounded-lg flex flex-col gap-2 px-6 pt-6">
      <div className="relative w-full h-1 bg-[#F2F0EE] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#A79D95] transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-700 mb-2">
        {amountRemaining > 0 ? (
          <>
            You're <b>${amountRemaining.toFixed(2)}</b> away from free shipping!
          </>
        ) : (
          "🎉 Congrats! You have free shipping!"
        )}
      </p>
    </div>
  );
}

/**
 * Temporary discount UI
 * @param discountCodes the current discount codes applied to the cart
 * @todo rework when a design is ready
 */
function CartDiscounts({
  discountCodes,
}: {
  discountCodes: CartType["discountCodes"];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({ code }) => code) || [];

  return (
    <>
      {/* Have existing discount, display it with a remove option */}
      <dl className={codes && codes.length !== 0 ? "grid" : "hidden"}>
        <div className="flex items-center justify-between font-medium">
          <dt>Discount(s)</dt>
          <div className="flex items-center justify-between">
            <UpdateDiscountForm>
              <button type="button">
                <TrashIcon
                  aria-hidden="true"
                  className="h-[18px] w-[18px] mr-1"
                />
              </button>
            </UpdateDiscountForm>
            <dd>{codes?.join(", ")}</dd>
          </div>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex items-center gap-3">
          <input
            className="p-3 border border-line rounded-none leading-tight! grow"
            type="text"
            name="discountCode"
            placeholder="Discount code"
          />
          <Button variant="outline" className="leading-tight!">
            Apply
          </Button>
        </div>
      </UpdateDiscountForm>
    </>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLines({
  layout = "drawer",
  lines: cartLines,
}: {
  layout: Layouts;
  lines: CartLine[];
}) {
  const currentLines = cartLines;
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);

  return (
    <div
      ref={scrollRef}
      className={clsx([
        y > 0 ? "border-t border-line-subtle" : "",
        layout === "page" && "w-full",
        layout === "drawer" && "transition",
      ])}
    >
      <ul
        className={clsx(
          layout === "page" && "flex flex-col",
          layout === "drawer" && "grid gap-5",
        )}
      >
        {currentLines.map((line, index) => (
          <CartLineItem
            key={line.id}
            line={line}
            layout={layout}
            isLastItem={index === currentLines.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}

function CartCheckoutActions({
  checkoutUrl,
  layout,
}: {
  checkoutUrl: string;
  layout: Layouts;
}) {
  if (!checkoutUrl) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* @todo: <CartShopPayButton cart={cart} /> */}
      {layout === "drawer" && (
        <Link
          variant="outline"
          to="/cart"
          className="w-full flex justify-center"
        >
          View cart
        </Link>
      )}
      <a href={checkoutUrl} target="_self">
        <Button className="w-full">Continue to Checkout</Button>
      </a>
    </div>
  );
}

function CartSummary({
  cost,
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  cost: CartApiQueryFragment["cost"];
  layout: Layouts;
}) {
  return (
    <div
      className={clsx(
        layout === "drawer" &&
          "sticky bottom-0 grid gap-4 border-t border-line-subtle p-4 bg-white",
        layout === "page" && "flex flex-col gap-6 px-6 pb-6 lg:w-1/3 w-full",
      )}
    >
      {layout === "page" && (
        <span className="font-semibold uppercase border-b border-line-subtle pb-6">
          Order summary
        </span>
      )}
      {layout === "drawer" && (
        <dl className="grid">
          <div className="flex items-center justify-between font-medium">
            <dt>Subtotal</dt>
            <dd>
              {cost?.subtotalAmount?.amount ? (
                <Money data={cost?.subtotalAmount} />
              ) : (
                "-"
              )}
            </dd>
          </div>
        </dl>
      )}
      {children}
    </div>
  );
}

type OptimisticData = {
  action?: string;
  quantity?: number;
};

function CartLineItem({
  line,
  layout,
  isLastItem,
}: {
  line: CartLine;
  layout: Layouts;
  isLastItem: boolean;
}) {
  const optimisticData = useOptimisticData<OptimisticData>(line?.id);

  if (!line?.id) return null;

  const { id, quantity, merchandise } = line;

  if (typeof quantity === "undefined" || !merchandise?.product) {
    return null;
  }

  let { image, title, product, selectedOptions } = merchandise;
  let url = `/products/${product.handle}`;
  if (selectedOptions?.length) {
    let params = new URLSearchParams();
    for (const option of selectedOptions) {
      params.append(option.name, option.value);
    }
    url += `?${params.toString()}`;
  }

  return (
    <li
      className={clsx(
        layout === "drawer"
          ? "flex gap-4"
          : "flex items-center h-full bg-white",
      )}
      style={{
        display: optimisticData?.action === "remove" ? "none" : "flex",
      }}
    >
      {/* Thumbnail */}
      <div
        className={clsx(
          "shrink-0",
          layout === "drawer" ? "" : "w-[360px] h-[360px]",
        )}
      >
        {image && (
          <Image
            width={layout === "drawer" ? 250 : 360}
            height={layout === "drawer" ? 250 : 360}
            data={image}
            className={clsx(
              "!object-cover",
              layout === "drawer" ? "w-36 h-auto" : "w-full h-full rounded",
            )}
            alt={title}
            aspectRatio={getImageAspectRatio(image, "1/1")}
          />
        )}
      </div>

      {/* Info Section */}
      <div
        className={clsx(
          "flex flex-col",
          layout === "drawer" ? "grow justify-between" : "p-6 h-[360px]",
        )}
      >
        {layout === "page" ? (
          // Page Layout - New Design
          <div className="flex flex-col justify-between h-full">
            <div>
              {/* Title and Close Button */}
              <div className="flex items-center justify-between gap-1 mb-4">
                <div className="flex-1">
                  {product?.handle ? (
                    <Link to={url} onClick={() => toggleCartDrawer(false)}>
                      <span className="font-semibold uppercase line-clamp-1">
                        {product?.title || ""}
                      </span>
                    </Link>
                  ) : (
                    <p className="font-semibold tracking-wide line-clamp-1">
                      {product?.title || ""}
                    </p>
                  )}
                </div>
                <ItemRemoveButton
                  lineId={id}
                  className="w-4 h-4"
                  layout={layout}
                />
              </div>

              {/* Variant Information */}
              <div className="flex flex-col font-normal">
                {title.split(" / ").map((option, index) => (
                  <span key={index} className="">
                    {option.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Quantity and Pricing */}
            <div className="flex items-center justify-between">
              <div className="">
                Item price: <CartLinePrice line={line} as="span" />
              </div>
              <CartLineQuantityAdjust
                line={line}
                isLastItem={isLastItem}
                layout={layout}
              />
              <div className="font-medium">
                <CartLinePrice line={line} as="span" />
              </div>
            </div>
          </div>
        ) : (
          // Drawer Layout - Original Design
          <>
            <div className="flex justify-between gap-4">
              <div className="space-y-1">
                <div>
                  {product?.handle ? (
                    <Link to={url} onClick={() => toggleCartDrawer(false)}>
                      <span className="font-semibold uppercase line-clamp-1">
                        {product?.title || ""}
                      </span>
                    </Link>
                  ) : (
                    <p>{product?.title || ""}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500 space-y-0.5">{title}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <CartLineQuantityAdjust
                line={line}
                isLastItem={isLastItem}
                layout={layout}
              />
              <CartLinePrice line={line} as="span" />
            </div>
            <ItemRemoveButton lineId={id} className="" layout={layout} />
          </>
        )}
      </div>
    </li>
  );
}

function ItemRemoveButton({
  lineId,
  className,
  layout,
}: {
  lineId: CartLine["id"];
  className?: string;
  layout: Layouts;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds: [lineId] }}
    >
      <button
        className={clsx("flex items-center justify-center", className)}
        type="submit"
      >
        {layout === "page" && <X className="w-4 h-4" />}
        {layout === "drawer" && (
          <span className="underline uppercase">Remove</span>
        )}
      </button>
      <OptimisticInput id={lineId} data={{ action: "remove" }} />
    </CartForm>
  );
}

function CartLineQuantityAdjust({
  line,
  isLastItem,
  layout,
}: {
  line: CartLine;
  isLastItem: boolean;
  layout: Layouts;
}) {
  let optimisticData = useOptimisticData<OptimisticData>(line?.id);
  const [isOpen, setIsOpen] = useState(false);

  if (!line || typeof line?.quantity === "undefined") {
    return null;
  }

  let optimisticQuantity = optimisticData?.quantity || line.quantity;
  let { id: lineId, isOptimistic } = line;

  const quantities = [1, 2, 3, 4, 5];

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".quantity-selector")) {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <label htmlFor={`quantity-${lineId}`} className="sr-only">
        Quantity, {optimisticQuantity}
      </label>
      <div className="relative quantity-selector">
        <button
          className={clsx(
            "flex gap-2 items-center py-2 min-w-[80px] relative bg-white",
            layout === "page" ? "" : "",
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          type="button"
          disabled={isOptimistic}
        >
          <span
            className={clsx(layout === "page" ? "text-sm font-medium" : "")}
          >
            QTY
          </span>
          <span
            className={clsx(
              "flex-1 text-center",
              layout === "page" ? "text-sm" : "",
            )}
          >
            {optimisticQuantity}
          </span>
          <CaretDown className={clsx(layout === "page" ? "w-3 h-3" : "")} />
        </button>

        {isOpen && (
          <div
            className={clsx(
              "absolute left-0 bg-white shadow-2xl rounded-md z-10 min-w-[80px]",
              isLastItem ? "bottom-full mb-1" : "top-full mt-1",
            )}
          >
            {quantities.map((qty) => (
              <CartForm
                key={qty}
                route="/cart"
                action={CartForm.ACTIONS.LinesUpdate}
                inputs={{
                  lines: [{ id: lineId, quantity: qty }],
                }}
              >
                <button
                  className={clsx(
                    "w-full text-center px-4 py-2 text-sm hover:bg-gray-100 transition",
                    qty === optimisticQuantity
                      ? "bg-gray-200 text-primary font-medium"
                      : "text-gray-700",
                  )}
                  type="submit"
                  disabled={isOptimistic || qty === optimisticQuantity}
                >
                  {qty}
                  {qty === optimisticQuantity && (
                    <OptimisticInput id={lineId} data={{ quantity: qty }} />
                  )}
                </button>
              </CartForm>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CartLinePrice({
  line,
  priceType = "regular",
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: "regular" | "compareAt";
  [key: string]: any;
}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === "regular"
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return (
    <Money
      withoutTrailingZeros
      {...passthroughProps}
      data={moneyV2}
      className="text-sm mr-2"
    />
  );
}

function CartEmpty({
  hidden = false,
  layout = "drawer",
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  let { cartTitleEmpty, buttonStartShopping, enableCartBestSellers } =
    useThemeSettings();
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);
  return (
    <div
      ref={scrollRef}
      className={clsx(
        layout === "drawer" && [
          "content-start space-y-12 px-5 pb-5 transition overflow-y-scroll h-screen-dynamic w-[400px]",
          y > 0 ? "border-t" : "",
        ],
        layout === "page" && [
          hidden ? "" : "grid",
          "pb-12 w-full md:items-start gap-4 md:gap-8 lg:gap-12",
        ],
      )}
      hidden={hidden}
    >
      <div className={clsx(layout === "page" && "text-center")}>
        {cartTitleEmpty && <p className="mb-4">{cartTitleEmpty}</p>}
        {buttonStartShopping && (
          <Link
            to={layout === "page" ? "/products" : ""}
            className={clsx(layout === "drawer" ? "w-full" : "min-w-48")}
            onClick={onClose}
          >
            {buttonStartShopping}
          </Link>
        )}
      </div>
      {enableCartBestSellers && (
        <div className="grid gap-4">
          <CartBestSellers
            count={4}
            heading="Shop Best Sellers"
            layout={layout}
            sortKey="BEST_SELLING"
          />
        </div>
      )}
    </div>
  );
}
