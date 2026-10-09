import {
  FacebookLogoIcon,
  LinkedinLogoIcon,
  LinkSimpleIcon,
  TwitterLogoIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { createSchema, isBrowser, useTranslation } from "@weaverse/hydrogen";
import { forwardRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLoaderData, useRouteLoaderData } from "react-router";
import {
  FacebookShareButton,
  LinkedinShareButton,
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
  showShareTwitter?: boolean;
  showShareFacebook?: boolean;
  showShareLinkedIn?: boolean;
}

const SHARE_ICON_CLASSES = cn(
  "flex size-10 shrink-0 items-center justify-center rounded-full",
  "border border-(--color-line-subtle) bg-(--color-background-subtle) text-(--color-text)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text)",
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
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [mounted, setMounted] = useState(false);
  const copied = status === "copied";
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (status === "idle") {
      return;
    }
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);
  return (
    <>
      <button
        type="button"
        className={SHARE_ICON_CLASSES}
        aria-label={t(copied ? "blog.linkCopied" : "blog.copyLink")}
        onClick={async () => {
          setStatus("idle");
          try {
            if (!navigator.clipboard?.writeText) {
              setStatus("error");
              return;
            }
            await navigator.clipboard.writeText(url);
            setStatus("copied");
          } catch {
            setStatus("error");
          }
        }}
      >
        <LinkSimpleIcon size={16} weight={copied ? "bold" : "regular"} />
      </button>
      {mounted &&
        createPortal(
          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={
              status === "idle"
                ? "sr-only"
                : "fixed inset-x-4 bottom-4 z-50 mx-auto w-fit max-w-full rounded-(--radius-md) border border-(--color-line-subtle) bg-(--color-background) px-4 py-3 text-center font-body text-(--color-text) text-sm shadow-md"
            }
          >
            {status === "copied"
              ? t("blog.articleLinkCopied")
              : status === "error"
                ? t("blog.copyLinkFailed")
                : ""}
          </span>,
          document.body,
        )}
    </>
  );
}

function ArticleShareGroup({
  url,
  title,
  showShareTwitter,
  showShareFacebook,
  showShareLinkedIn,
}: {
  url: string;
  title: string;
} & Pick<
  BlogPostProps,
  "showShareTwitter" | "showShareFacebook" | "showShareLinkedIn"
>) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) {
    return null;
  }
  return (
    <div className="mx-auto mt-4 w-full max-w-(--article-width) md:mt-5 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:mr-10 lg:ml-0 lg:h-full lg:w-fit lg:justify-self-end lg:pt-16">
      <div className="flex w-fit max-w-full flex-wrap items-center gap-3 rounded-(--radius-md) border border-(--color-line-subtle) bg-(--color-background) px-3 py-4 lg:sticky lg:top-28 lg:min-w-14 lg:flex-col lg:flex-nowrap lg:gap-4 lg:px-2 lg:py-3">
        <span className="font-body font-normal text-(--color-text-subtle) text-sm leading-(--body-base-line-height) tracking-(--body-base-spacing)">
          {t("blog.share")}
        </span>
        {showShareTwitter && (
          <XShareButton
            url={url}
            title={title}
            resetButtonStyle={false}
            className={SHARE_ICON_CLASSES}
            aria-label={t("blog.shareTwitter")}
          >
            <TwitterLogoIcon size={20} />
          </XShareButton>
        )}
        {showShareFacebook && (
          <FacebookShareButton
            url={url}
            resetButtonStyle={false}
            className={SHARE_ICON_CLASSES}
            aria-label={t("blog.shareFacebook")}
          >
            <FacebookLogoIcon size={20} />
          </FacebookShareButton>
        )}
        {showShareLinkedIn && (
          <LinkedinShareButton
            url={url}
            title={title}
            resetButtonStyle={false}
            className={SHARE_ICON_CLASSES}
            aria-label={t("blog.shareLinkedIn")}
          >
            <LinkedinLogoIcon size={20} />
          </LinkedinShareButton>
        )}
        <button
          type="button"
          className={SHARE_ICON_CLASSES}
          aria-label={t("blog.closeShare")}
          onClick={() => setDismissed(true)}
        >
          <XCircleIcon size={20} />
        </button>
        <CopyLinkButton url={url} />
      </div>
    </div>
  );
}

const BlogPost = forwardRef<HTMLElement, BlogPostProps>((props, ref) => {
  const { t } = useTranslation();
  const {
    showTags = true,
    showShareButtons = true,
    showShareTwitter = true,
    showShareFacebook = true,
    showShareLinkedIn = false,
    ...rest
  } = props;
  const { layout } = useRouteLoaderData<RootLoader>("root");
  const { article, blog, formattedDate } = useLoaderData<{
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
    const articleUrl = isBrowser
      ? `${domain}${window.location.pathname}`
      : `${domain}/blogs/${blog.handle}/${handle}`;
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
        <div className="grid px-5 [--article-width:720px] md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,var(--article-width))_minmax(0,1fr)]">
          <article className="prose mx-auto w-full min-w-0 max-w-(--article-width) pt-10 md:pt-16 lg:col-start-2 lg:row-start-1 [&_h2]:font-heading [&_h2]:font-normal [&_h2]:tracking-[-0.02em] [&_h3]:font-heading [&_h3]:font-normal [&_h3]:tracking-[-0.02em] [&_img]:rounded-(--radius-md) [&_p]:font-body [&_p]:text-sm [&_p]:leading-[1.6] [&_p]:tracking-[0.01em]">
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
          </article>
          {showShareButtons && (
            <ArticleShareGroup
              key={articleUrl}
              url={articleUrl}
              title={title}
              showShareTwitter={showShareTwitter}
              showShareFacebook={showShareFacebook}
              showShareLinkedIn={showShareLinkedIn}
            />
          )}
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
        {
          type: "switch",
          label: "Share on Twitter / X",
          name: "showShareTwitter",
          defaultValue: true,
          condition: "showShareButtons.eq.true",
        },
        {
          type: "switch",
          label: "Share on Facebook",
          name: "showShareFacebook",
          defaultValue: true,
          condition: "showShareButtons.eq.true",
        },
        {
          type: "switch",
          label: "Share on LinkedIn",
          name: "showShareLinkedIn",
          defaultValue: false,
          condition: "showShareButtons.eq.true",
        },
      ],
    },
  ],
});
