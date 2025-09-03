import { ArrowRight } from "@phosphor-icons/react";
import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { Link, useLoaderData } from "react-router";
import type { ArticleFragment } from "storefront-api.generated";
import Heading from "~/components/heading";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import { getImageLoadingPriority } from "~/utils/image";
import { ArticleCard, type ArticleCardProps } from "./blogs";

interface RelatedArticlesProps
  extends Omit<ArticleCardProps, "article" | "blogHandle" | "loading">,
    SectionProps {
  heading: string;
  showViewAll?: boolean;
  viewAllText?: string;
}

const RelatedArticles = forwardRef<HTMLElement, RelatedArticlesProps>(
  (props, ref) => {
    const { blog, relatedArticles } = useLoaderData<{
      relatedArticles: ArticleFragment[];
      blog: { handle: string };
    }>();
    const {
      heading,
      showViewAll,
      viewAllText,
      showExcerpt,
      showAuthor,
      showDate,
      showReadmore,
      imageAspectRatio,
      ...rest
    } = props;

    if (relatedArticles.length > 0) {
      return (
        <Section ref={ref} {...rest} className="px-10 py-10">
          {/* Header section with title and view all button */}
          <div className="mb-10 flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-tenor text-[#29231E] text-[26px] uppercase leading-[1.1] tracking-[0.02em]">
                {heading}
              </h2>
            </div>
            {showViewAll && (
              <div className="flex items-center gap-2">
                <Link
                  to={`/blogs/${blog.handle}`}
                  className="flex items-center gap-2.5 px-1 py-1 text-[#29231E] transition-opacity hover:opacity-70"
                >
                  <span className="font-open-sans text-sm uppercase leading-[1em] tracking-[0.02em]">
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
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            {relatedArticles.slice(0, 3).map((article, i) => (
              <div key={article.id} className="flex flex-col gap-5">
                <ArticleCard
                  blogHandle={blog.handle}
                  article={article}
                  loading={getImageLoadingPriority(i, 2)}
                  showAuthor={showAuthor}
                  showExcerpt={showExcerpt}
                  showDate={showDate}
                  showReadmore={showReadmore}
                  imageAspectRatio={imageAspectRatio}
                  className="w-full"
                />
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
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          defaultValue: "adapt",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
        {
          type: "switch",
          name: "showExcerpt",
          label: "Show excerpt",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "showDate",
          label: "Show date",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "showAuthor",
          label: "Show author",
          defaultValue: false,
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
