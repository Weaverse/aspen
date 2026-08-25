import { EyeIcon } from "@phosphor-icons/react";
import { Money } from "@shopify/hydrogen";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
  type WeaverseProduct,
  type WeaverseVideo,
} from "@weaverse/hydrogen";
import { forwardRef, lazy, Suspense } from "react";
import type { ProductQuery } from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { PRODUCT_QUERY } from "~/graphql/queries";
import { useClientReady } from "~/utils/react-player";

const ReactPlayer = lazy(() => import("react-player"));

const VideoPlaceholder = () => {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4 text-gray-400">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M10 8L16 12L10 16V8Z" fill="currentColor" />
          <path
            d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>

        <p className="font-medium text-sm">{t("video.none")}</p>
      </div>
    </div>
  );
};

interface VideoItemData {
  video: WeaverseVideo;
  product?: WeaverseProduct;
  addToCartText?: string;
}

interface VideoItemProps
  extends HydrogenComponentProps<Awaited<ReturnType<typeof loader>>>,
    VideoItemData {}

let VideoItem = forwardRef<HTMLDivElement, VideoItemProps>((props, ref) => {
  const { t } = useTranslation();
  let {
    video,
    product,
    addToCartText = "Add to Cart",
    loaderData,
    ...rest
  } = props;

  const hasVideo = Boolean(video?.url?.trim());
  const clientReady = useClientReady();

  const productData = loaderData?.product;
  const selectedVariant = productData?.selectedOrFirstAvailableVariant;
  const productImage = selectedVariant?.image || productData?.featuredImage;
  const productUrl = productData?.handle
    ? `/products/${productData.handle}`
    : undefined;

  return (
    <div
      ref={ref as any}
      {...rest}
      className="group relative flex aspect-(--aspect-ratio) h-full w-full flex-col overflow-hidden rounded-[12px] bg-[#EDEDED]"
    >
      {hasVideo ? (
        <div className="absolute inset-0 h-full w-full">
          {clientReady ? (
            <Suspense fallback={<VideoPlaceholder />}>
              <ReactPlayer
                src={video.url}
                playing
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                width="100%"
                height="100%"
                config={{
                  youtube: {
                    rel: 0,
                    fs: 0,
                    iv_load_policy: 3,
                  },
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Suspense>
          ) : (
            <VideoPlaceholder />
          )}
        </div>
      ) : (
        <VideoPlaceholder />
      )}

      {productData && selectedVariant && (
        <div className="pointer-events-none opacity-0 transition-opacity duration-300 [.swiper-slide-active_&]:pointer-events-auto [.swiper-slide-active_&]:opacity-100 lg:[.swiper-slide-active_&]:pointer-events-none lg:[.swiper-slide-active_&]:opacity-0 lg:group-focus-within:pointer-events-auto lg:group-focus-within:opacity-100 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[124px] bg-gradient-to-t from-[#71685F]/85 to-transparent" />

          <div className="absolute right-3 bottom-3 left-3 flex h-[100px] overflow-hidden rounded-[12px] bg-white text-[#343231]">
            {productImage && productUrl && (
              <Link
                to={productUrl}
                className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[12px] bg-[#F4F4F5]"
                aria-label={t("product.viewProduct", {
                  product: productData.title,
                })}
              >
                <Image
                  data={productImage}
                  width={200}
                  sizes="100px"
                  className="h-full w-full"
                  alt={productImage.altText || productData.title}
                />
              </Link>
            )}

            <div className="flex min-w-0 flex-1 flex-col px-4 py-3">
              <Link
                to={productUrl || "#"}
                className="justify-start! truncate font-body text-[12px] leading-[14px]"
              >
                {productData.title}
              </Link>

              <Money
                withoutTrailingZeros
                data={selectedVariant.price}
                className="mt-1 font-body text-[12px] leading-[14px]"
              />

              <div className="mt-auto flex items-center gap-1.5">
                <AddToCartButton
                  disabled={!selectedVariant.availableForSale}
                  lines={[
                    {
                      merchandiseId: selectedVariant.id,
                      quantity: 1,
                      selectedVariant,
                    },
                  ]}
                  containerClassName="min-w-0 flex-1"
                  className="h-7! w-full! min-w-0! truncate! rounded-[8px]! px-3! py-0! font-body! text-[12px]! leading-none!"
                  width="auto"
                >
                  {addToCartText}
                </AddToCartButton>

                {productUrl && (
                  <Link
                    to={productUrl}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-[#D8D8D8] bg-white"
                    aria-label={t("product.viewProduct", {
                      product: productData.title,
                    })}
                  >
                    <EyeIcon size={15} weight="regular" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const loader = async (args: ComponentLoaderArgs<VideoItemData>) => {
  const { weaverse, data } = args;
  const { storefront } = weaverse;

  if (!data?.product?.handle) {
    return null;
  }

  try {
    const { product } = await storefront.query<ProductQuery>(PRODUCT_QUERY, {
      variables: {
        handle: data.product.handle,
        selectedOptions: [],
        language: storefront.i18n.language,
        country: storefront.i18n.country,
      },
    });

    return { product };
  } catch (error) {
    console.error("Error loading video product data:", error);
    return null;
  }
};

export let schema = createSchema({
  type: "video--item",
  title: "Video",
  limit: 4,
  settings: [
    {
      group: "Video",
      inputs: [
        {
          type: "video",
          name: "video",
          label: "Video",
          helpText: "Support YouTube, Vimeo, MP4, WebM, and HLS streams.",
        },
      ],
    },
    {
      group: "Shoppable product",
      inputs: [
        {
          type: "product",
          name: "product",
          label: "Featured product",
          helpText:
            "Optional. When selected, a compact product card appears over the bottom of the video.",
        },
        {
          type: "text",
          name: "addToCartText",
          label: "Add to cart label",
          defaultValue: "Add to Cart",
          condition: "product.not.eq.blank",
        },
      ],
    },
  ],
});

VideoItem.displayName = "VideoItem";

export default VideoItem;
