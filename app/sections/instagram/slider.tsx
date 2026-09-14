import { Image as ImageIcon, InstagramLogo } from "@phosphor-icons/react";
import { Image } from "@shopify/hydrogen";
import {
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
} from "@weaverse/hydrogen";
import { forwardRef } from "react";
import {
  DESKTOP_MIN_PX,
  minWidthQuery,
  TABLET_MIN_PX,
} from "~/utils/breakpoints";
import { type InstagramMedia, useInstagramContext } from "./context";

interface InstagramGridProps extends HydrogenComponentProps {}

const placeholderImages = [
  "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Guin-Round-Coffee-Table-Square-Set_1-1710403519.webp?v=1755139816",
  "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Dawson-Queen-Size-Storage-Bed-Beach-Linen-Square-Det_2-1698291168.jpg?v=1755140106",
  "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Hamilton-Swivel-Armchairs-Brilliant-White-Square-Set_1-1692867870.jpg?v=1755140064",
  "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Hamilton-Sectional-Sofa-Brilliant-White-Square-Det_6-1672979175.jpg?v=1755140004",
  "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Guin-Round-Coffee-Table-Det_1-1710403519.webp?v=1755139972",
  "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Hamilton-Left-Sectional-Sofa-Brilliant-White-Square-Set_4.jpg?v=1755139930",
  "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Hamilton-Swivel-Armchairs-Brilliant-White-Square-Set_1-1692867870.jpg?v=1755140064",
  "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Dawson-Queen-Size-Storage-Bed-Beach-Linen-Square-Det_2-1698291168.jpg?v=1755140106",
];

const defaultInstagramData: InstagramMedia[] = placeholderImages.map(
  (mediaUrl, index) => ({
    id: `default-${index}`,
    media_url: mediaUrl,
  }),
);

const InstagramGrid = forwardRef<HTMLDivElement, InstagramGridProps>(
  ({ children, ...rest }, ref) => {
    const { t } = useTranslation();
    const { loaderData } = useInstagramContext();
    const images: InstagramMedia[] = (
      loaderData?.data?.length ? loaderData.data : defaultInstagramData
    ).slice(0, 8);

    return (
      <div
        ref={ref}
        {...rest}
        className="instagram-grid-wrap w-full min-w-0 md:flex-1"
      >
        <div className="instagram-grid grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-5">
          {images.map((item, index) => {
            const imageUrl = item.thumbnail_url || item.media_url;
            const tile = (
              <>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={t("social.instagramPost", { index: index + 1 })}
                    className="h-full w-full object-cover object-center"
                    sizes={`${minWidthQuery(DESKTOP_MIN_PX)} 260px, ${minWidthQuery(TABLET_MIN_PX)} 22vw, calc((100vw - 48px) / 2)`}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[#EBE8E5]">
                    <ImageIcon
                      aria-hidden="true"
                      className="size-[50px] text-[#524B46] opacity-60"
                    />
                  </span>
                )}
                <span className="pointer-events-none absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100" />
                <InstagramLogo className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 z-1 size-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100" />
              </>
            );
            const className =
              "instagram-tile group relative block aspect-square w-full overflow-hidden rounded-[var(--Radius-border-radius-md,12px)] bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

            return (
              <a
                key={item.id || index}
                href={
                  item.permalink ||
                  (item.username
                    ? `https://www.instagram.com/${item.username}/`
                    : "https://www.instagram.com/")
                }
                target="_blank"
                rel="noreferrer"
                aria-label={
                  item.username
                    ? t("social.instagramPostBy", {
                        index: index + 1,
                        username: item.username,
                      })
                    : t("social.instagramPost", { index: index + 1 })
                }
                className={className}
              >
                {tile}
              </a>
            );
          })}
        </div>
        {children}
      </div>
    );
  },
);

export default InstagramGrid;

export const schema = createSchema({
  type: "instagram--slider",
  title: "Image grid",
  limit: 1,
  settings: [],
  presets: {},
});
