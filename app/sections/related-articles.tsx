import { ArrowRight } from "@phosphor-icons/react";
import { createSchema, useTranslation } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { useLoaderData } from "react-router";
import type { ArticleFragment } from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import { useLocale } from "~/hooks/use-locale";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { minWidthQuery, TABLET_MIN_PX } from "~/utils/breakpoints";
import { getImageLoadingPriority } from "~/utils/image";
import { formatDate } from "~/utils/locale";
import type { ArticleCardProps } from "./blogs";

interface RelatedArticlesProps
  extends Omit<ArticleCardProps, "article" | "loading">,
    SectionProps {
  heading: string;
  showViewAll?: boolean;
  showCategory?: boolean;
  showCategoryDesktop?: boolean;
  viewAllText?: string;
}

const RelatedArticles = forwardRef<HTMLElement, RelatedArticlesProps>(
  (props, ref) => {
    const translateText = useTranslatedText();

    const { t } = useTranslation();
    const locale = useLocale();
    const { relatedArticles } = useLoaderData<{
      relatedArticles: ArticleFragment[];
      blog: { handle: string };
    }>();
    const {
      heading: rawI18nHeading,
      showViewAll,
      viewAllText: rawI18nViewAllText,
      showExcerpt = true,
      showCategory = true,
      showCategoryDesktop = false,
      showAuthor = true,
      showDate = true,
      showReadmore,
      imageAspectRatio: _imageAspectRatio,
      ...rest
    } = props;
    const viewAllText = translateText(
      rawI18nViewAllText,
      "themeContent.sectionsRelatedArticles.viewAllText",
    );
    const heading = translateText(
      rawI18nHeading,
      "themeContent.sectionsRelatedArticles.heading",
    );

    if (relatedArticles.length > 0) {
      return (
        <Section ref={ref} {...rest} className="" containerClassName="pt-10!">
          {/* Header section with title and view all button */}
          <div className="mb-10 flex w-full items-center justify-between">
            <div className="flex min-w-0 items-center gap-4 self-stretch md:flex-[1_0_0] md:gap-2 md:self-auto xl:flex-initial xl:gap-4 xl:self-stretch">
              <h2 className="font-heading text-[#29231E] text-[26px] uppercase leading-[1.1] tracking-[-0.02em]">
                {heading}
              </h2>
            </div>
            {showViewAll && (
              <div className="flex items-center gap-2">
                <Link
                  to="/blogs"
                  className="flex items-center gap-2.5 px-1 py-1 text-[#29231E] transition-opacity hover:opacity-70"
                >
                  <span className="font-body text-sm uppercase leading-[1em] tracking-[0.02em]">
                    {viewAllText}
                  </span>
                  <ArrowRight
                    size={20}
                    weight="regular"
                    className="text-[#29231E]"
                  />
                </Link>
              </div>
            )}
          </div>

          {/* Articles grid */}
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 md:gap-4">
            {relatedArticles.slice(0, 3).map((article, i) => (
              <div key={article.id} className="flex flex-col gap-4">
                <article className="flex min-w-0 flex-col items-start gap-3 self-stretch font-dm-sans text-[#343231] md:block">
                  <Link
                    to={`/blogs/${article.handle}`}
                    prefetch="intent"
                    className="flex min-w-0 flex-col items-start justify-start gap-3 self-stretch md:block xl:flex xl:gap-5"
                  >
                    {article.image && (
                      <div className="w-full aspect-[16/9] overflow-hidden rounded-[var(--Radius-border-radius-md,12px)] bg-gray-200 md:aspect-auto md:h-[132.373px] xl:aspect-square xl:h-auto">
                        <Image
                          data={article.image}
                          alt={article.image.altText || article.title}
                          loading={getImageLoadingPriority(i, 2)}
                          sizes={`(min-width:1280px) 440px, ${minWidthQuery(TABLET_MIN_PX)} 33vw, 100vw`}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                    )}
                    <div className="contents xl:flex xl:w-full xl:flex-[1_0_0] xl:flex-col xl:items-start xl:gap-4">
                      {(showCategory || showCategoryDesktop) &&
                        article.tags?.[0] && (
                          <p
                            className={`font-normal text-[#979797] text-xs uppercase leading-none tracking-[0.24px] md:mt-4 xl:mt-0 ${showCategory ? "block" : "hidden"} ${showCategoryDesktop ? "xl:block" : "xl:hidden"}`}
                          >
                            {article.tags[0]}
                          </p>
                        )}
                      <h3 className="md:mt-3 font-tenor font-normal text-[26px] leading-[1.1] tracking-[-0.52px] xl:mt-0 xl:line-clamp-3 xl:text-[32px] xl:tracking-[-0.64px]">
                        {article.title}
                      </h3>
                      {showExcerpt && article.excerpt && (
                        <p className="md:mt-4 hidden font-normal text-sm leading-[1.6] tracking-[0.14px] xl:mt-0 xl:line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}
                      {((showDate && article.publishedAt) ||
                        (showAuthor && article.author?.name)) && (
                        <p className="md:mt-3 flex flex-wrap items-center gap-3 self-stretch font-normal text-[#979797] text-xs leading-none tracking-[0.24px] xl:hidden">
                          {showDate && article.publishedAt && (
                            <time
                              dateTime={article.publishedAt}
                              className="uppercase"
                            >
                              {formatDate(article.publishedAt, locale, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                          )}
                          {showAuthor && article.author?.name && (
                            <span>
                              {t("blog.byAuthor", {
                                author: article.author.name,
                              })}
                            </span>
                          )}
                        </p>
                      )}
                      {((showDate && article.publishedAt) ||
                        (showAuthor && article.author?.name)) && (
                        <p className="md:mt-3 hidden text-[#979797] text-xs leading-none tracking-[0.24px] xl:mt-0 xl:block">
                          {showDate &&
                            article.publishedAt &&
                            formatDate(article.publishedAt, locale, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          {showAuthor &&
                            article.author?.name &&
                            `${showDate && article.publishedAt ? " — " : ""}${article.author.name}`}
                        </p>
                      )}
                      {showReadmore && (
                        <span className="group/read-more md:mt-4 flex w-fit items-center gap-2 font-semibold text-[#524B46] text-sm capitalize leading-none tracking-[0.28px] xl:mt-4 xl:font-normal xl:uppercase xl:leading-[1.6] xl:tracking-[0.14px]">
                          {t("navigation.readMore")}
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform duration-300 group-hover/read-more:translate-x-1 motion-reduce:transition-none xl:hidden"
                          />
                        </span>
                      )}
                    </div>
                  </Link>
                </article>
              </div>
            ))}
          </div>
        </Section>
      );
    }
    return <section ref={ref} />;
  },
);

export default RelatedArticles;

export const schema = createSchema({
  type: "related-articles",
  title: "Related articles",
  limit: 1,
  enabledOn: {
    pages: ["ARTICLE"],
  },
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs,
    },
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Related articles",
          placeholder: "Related articles",
        },
        {
          type: "switch",
          name: "showViewAll",
          label: "Show view all button",
          defaultValue: true,
        },
        {
          type: "text",
          name: "viewAllText",
          label: "View all text",
          defaultValue: "VIEW ALL",
          placeholder: "VIEW ALL",
          condition: "showViewAll.eq.true",
        },
        {
          type: "switch",
          name: "showExcerpt",
          label: "Show excerpt",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showCategory",
          label: "Show category (tablet/mobile)",
          helpText:
            "Uses the first article tag. Articles without tags have no category.",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showCategoryDesktop",
          label: "Show category (desktop)",
          defaultValue: false,
          helpText: "Uses the first article tag.",
        },
        {
          type: "switch",
          name: "showDate",
          label: "Show date",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showAuthor",
          label: "Show author",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showReadmore",
          label: "Show read more",
          defaultValue: true,
        },
      ],
    },
  ],
});
