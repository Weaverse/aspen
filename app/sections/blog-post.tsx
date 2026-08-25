import {
  FacebookLogoIcon,
  LinkSimpleIcon,
  PinterestLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { createSchema, isBrowser, useTranslation } from "@weaverse/hydrogen";
import { forwardRef, useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";
import {
  FacebookShareButton,
  PinterestShareButton,
  XShareButton,
} from "react-share";
import type { ArticleQuery } from "storefront-api.generated";
import { Image } from "~/components/image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";

interface BlogPostProps extends SectionProps {
  showTags: boolean;
  showShareButtons: boolean;
}

const SHARE_ICON_CLASSES = cn(
  "flex size-10 items-center justify-center rounded-full",
  "bg-(--color-background) text-(--color-text)",
  "transition-colors hover:bg-(--color-background-subtle-2)",
);

function estimateReadMinutes(html: string) {
  const words = html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function CopyLinkButton({ url }: { url: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={SHARE_ICON_CLASSES}
      aria-label={t(copied ? "blog.linkCopied" : "blog.copyLink")}
      onClick={() => {
        navigator.clipboard?.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      <LinkSimpleIcon size={16} weight={copied ? "bold" : "regular"} />
    </button>
  );
}

const BlogPost = forwardRef<HTMLElement, BlogPostProps>((props, ref) => {
  const { t } = useTranslation();
  const { showTags = true, showShareButtons = true, ...rest } = props;
  const { layout } = useRouteLoaderData<RootLoader>("root");
  const { article, formattedDate } = useLoaderData<{
    article: ArticleQuery["blog"]["articleByHandle"];
    blog: ArticleQuery["blog"];
    formattedDate: string;
  }>();
  const { title, handle, image, contentHtml, author, tags } = article;
  if (article) {
    let domain = layout.shop.primaryDomain.url;
    if (isBrowser) {
      const origin = window.location.origin;
      if (!origin.includes("localhost")) {
        domain = origin;
      }
    }
    const articleUrl = `${domain}/blogs/${handle}`;
    const readMinutes = estimateReadMinutes(contentHtml || "");
    const category = tags?.[0];

    return (
      <Section ref={ref} {...rest} width="full" verticalPadding="none">
        {/* Hero: full-bleed image with bottom-left overlay */}
        <div className="relative h-[480px] w-full md:h-[720px]">
          {image && (
            <Image
              data={image}
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 px-5 pb-10 md:px-10 md:pb-16">
            {category && (
              <span className="w-fit rounded-full bg-(--color-background) px-3 py-1.5 font-body text-(--color-text) text-xs uppercase leading-none tracking-[0.02em]">
                {category}
              </span>
            )}
            <h1 className="max-w-[1100px] font-heading font-normal text-[32px] text-[#FEF4EB] leading-[1.1] tracking-[-0.03em] md:text-[44px]">
              {title}
            </h1>
            <div className="flex items-center gap-3">
              {author?.name && (
                <span
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-full bg-(--color-background) font-body font-semibold text-(--color-text) text-sm uppercase"
                >
                  {author.name.charAt(0)}
                </span>
              )}
              <div className="flex flex-wrap items-center gap-3 text-[#FEF4EB]">
                {author?.name && (
                  <span className="font-body text-sm leading-[1.4] tracking-[0.01em]">
                    {author.name}
                  </span>
                )}
                {formattedDate && (
                  <span className="font-body text-sm leading-[1.4] tracking-[0.01em]">
                    {formattedDate}
                  </span>
                )}
                <span className="font-body text-xs uppercase leading-none tracking-[0.02em] opacity-80">
                  {t("blog.readMinutes", { count: readMinutes })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body: floating share sidebar + 720px article column */}
        <div className="relative px-5 pb-16 md:px-10 md:pb-24">
          {showShareButtons && (
            <div className="absolute top-10 left-10 hidden xl:block 2xl:left-[calc(50%-448px)]">
              <div className="sticky top-28 flex w-14 flex-col items-center gap-4 rounded-2xl bg-(--color-background-subtle) px-3 py-4">
                <span className="font-body text-(--color-text-subtle) text-xs uppercase leading-none tracking-[0.02em]">
                  {t("blog.share")}
                </span>
                <XShareButton
                  url={articleUrl}
                  title={title}
                  resetButtonStyle={false}
                  className={SHARE_ICON_CLASSES}
                >
                  <XLogoIcon size={16} />
                </XShareButton>
                <FacebookShareButton
                  url={articleUrl}
                  resetButtonStyle={false}
                  className={SHARE_ICON_CLASSES}
                >
                  <FacebookLogoIcon size={16} />
                </FacebookShareButton>
                <PinterestShareButton
                  url={articleUrl}
                  media={image?.url}
                  resetButtonStyle={false}
                  className={SHARE_ICON_CLASSES}
                >
                  <PinterestLogoIcon size={16} />
                </PinterestShareButton>
                <CopyLinkButton url={articleUrl} />
              </div>
            </div>
          )}
          <article className="prose mx-auto max-w-[720px] pt-10 md:pt-16 [&_h2]:font-heading [&_h2]:font-normal [&_h2]:tracking-[-0.02em] [&_h3]:font-heading [&_h3]:font-normal [&_h3]:tracking-[-0.02em] [&_img]:rounded-(--radius-md) [&_p]:font-body [&_p]:text-sm [&_p]:leading-[1.6] [&_p]:tracking-[0.01em]">
            <div
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
            {showTags && tags?.length > 0 && (
              <div className="mt-12 border-line-subtle border-t pt-6">
                <strong className="font-body text-sm uppercase tracking-[0.02em]">
                  {t("blog.tags")}:
                </strong>
                <span className="ml-2 font-body text-sm leading-[1.6] tracking-[0.01em]">
                  {tags.join(", ")}
                </span>
              </div>
            )}
            {showShareButtons && (
              <div className="mt-6 flex items-center gap-2 xl:hidden">
                <strong className="font-body text-sm uppercase tracking-[0.02em]">
                  {t("blog.share")}:
                </strong>
                <FacebookShareButton url={articleUrl}>
                  <FacebookLogoIcon size={24} />
                </FacebookShareButton>
                <PinterestShareButton url={articleUrl} media={image?.url}>
                  <PinterestLogoIcon size={24} />
                </PinterestShareButton>
                <XShareButton url={articleUrl} title={title}>
                  <XLogoIcon size={24} />
                </XShareButton>
              </div>
            )}
          </article>
        </div>
      </Section>
    );
  }
  return <Section ref={ref} {...rest} />;
});

export default BlogPost;

export const schema = createSchema({
  type: "blog-post",
  title: "Blog post",
  limit: 1,
  enabledOn: {
    pages: ["ARTICLE"],
  },
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((input) => input.name !== "borderRadius"),
    },
    {
      group: "Article",
      inputs: [
        {
          type: "switch",
          label: "Show tags",
          name: "showTags",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show share buttons",
          name: "showShareButtons",
          defaultValue: true,
        },
      ],
    },
  ],
});
