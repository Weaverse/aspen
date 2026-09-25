import { Image as ImageIcon, InstagramLogo } from "@phosphor-icons/react";
import { Image } from "@shopify/hydrogen";
import {
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
} from "@weaverse/hydrogen";
import { Children, forwardRef } from "react";
import {
  DESKTOP_MIN_PX,
  minWidthQuery,
  TABLET_MIN_PX,
} from "~/utils/breakpoints";
import { type InstagramMedia, useInstagramContext } from "./context";

interface InstagramGridProps extends HydrogenComponentProps {}

// Empty media_url renders the neutral image-icon placeholder tile; demo
// storefront imagery must not ship in the theme.
const defaultInstagramData: InstagramMedia[] = Array.from(
  { length: 8 },
  (_, index) => ({
    id: `placeholder-${index}`,
    media_url: "",
  }),
);

const InstagramGrid = forwardRef<HTMLDivElement, InstagramGridProps>(
  ({ children, ...rest }, ref) => {
    const { t } = useTranslation();
    const { loaderData } = useInstagramContext();
    const customImages = Children.toArray(children);
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
          {customImages.length > 0
            ? customImages
            : images.map((item, index) => {
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
  childTypes: ["instagram--image"],
  presets: {
    children: Array.from({ length: 8 }, () => ({
      type: "instagram--image",
    })),
  },
});
