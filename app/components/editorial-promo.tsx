import { Image } from "~/components/image";
import Link from "~/components/link";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { useTranslatedThemeSettings } from "~/hooks/use-translated-theme-settings";

type EditorialImage = {
  url?: string;
  altText?: string;
};

export function CollectionEditorialPromo() {
  const translateText = useTranslatedText();
  const {
    collectionEditorialImage,
    collectionEditorialHeading,
    collectionEditorialLinkText,
    collectionEditorialLink,
    searchEditorialImage,
    searchEditorialHeading = "Decorate for holidays and beyond",
    searchEditorialLinkText = "Explore now",
    searchEditorialLink = "/collections",
  } = useTranslatedThemeSettings();

  const image = (
    collectionEditorialImage?.url
      ? collectionEditorialImage
      : searchEditorialImage
  ) as EditorialImage | undefined;
  const heading = translateText(
    collectionEditorialHeading || searchEditorialHeading,
    collectionEditorialHeading
      ? "themeSettings.collectionEditorialHeading"
      : "themeSettings.searchEditorialHeading",
  );
  const linkText = translateText(
    collectionEditorialLinkText || searchEditorialLinkText,
    collectionEditorialLinkText
      ? "themeSettings.collectionEditorialLinkText"
      : "themeSettings.searchEditorialLinkText",
  );
  const link = collectionEditorialLink || searchEditorialLink || "/collections";

  if (!image?.url) {
    return null;
  }

  return (
    <section className="hidden w-full overflow-hidden rounded-xl border border-line-subtle md:mb-4 md:block lg:mb-8">
      <div className="relative h-[320px] md:h-[520px]">
        <Image
          data={image}
          alt={image.altText || ""}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          sizes="(min-width: 1440px) 1440px, calc(100vw - 2 * var(--page-padding))"
        />
        <h2 className="absolute top-10 left-6 max-w-[290px] font-heading text-[34px] uppercase leading-[1.05] tracking-[-0.04em] text-[#2f302f] md:top-16 md:left-16 md:max-w-[510px] md:text-[52px]">
          {heading}
        </h2>
      </div>
      <div className="flex min-h-16 items-center bg-background px-5 md:min-h-20 md:px-6">
        <Link to={link} variant="decor" className="font-semibold uppercase">
          {linkText}
        </Link>
      </div>
    </section>
  );
}
