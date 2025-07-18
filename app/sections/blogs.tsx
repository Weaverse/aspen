import { createSchema } from "@weaverse/hydrogen";
import { forwardRef, type CSSProperties, useState } from "react";
import { useLoaderData } from "react-router";
import type { ArticleFragment, BlogQuery } from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { Button } from "~/components/button";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import Heading, { headingInputs, type HeadingProps } from "~/components/heading";
import { RevealUnderline } from "~/reveal-underline";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { getImageAspectRatio, getImageLoadingPriority } from "~/utils/image";

interface BlogsProps
  extends Omit<ArticleCardProps, "article" | "blogHandle" | "loading">,
    Omit<HeadingProps, "as" | "content">,
    SectionProps {
  layout: "blog" | "default";
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  imageBorderRadius?: string;
  initialCount?: number;
  loadMoreCount?: number;
  // Button props
  buttonVariant?: "primary" | "secondary" | "outline" | "decor" | "custom";
  buttonText?: string;
}

const Blogs = forwardRef<HTMLElement, BlogsProps>((props, ref) => {
  const {
    layout,
    showExcerpt,
    showAuthor,
    showDate,
    showReadmore,
    imageAspectRatio,
    imageBorderRadius,
    initialCount = 6,
    loadMoreCount = 6,
    // Button props
    buttonVariant = "primary",
    buttonText = "Load More",
    // Heading props
    headingTagName,
    color,
    size,
    mobileSize,
    desktopSize,
    minSize,
    maxSize,
    weight,
    letterSpacing,
    alignment,
    ...rest
  } = props;
  const { blog, articles } = useLoaderData<
    BlogQuery & { articles: ArticleFragment[] }
  >();

  // State to manage visible articles count
  const [visibleCount, setVisibleCount] = useState(initialCount);

  // Get visible articles
  const visibleArticles = articles.slice(0, visibleCount);
  const hasMoreArticles = visibleCount < articles.length;

  // Handle load more
  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + loadMoreCount, articles.length));
  };

  if (blog) {
    return (
      <Section ref={ref} {...rest}>
        <Heading
          content={blog.title}
          as={headingTagName}
          color={color}
          size={size}
          mobileSize={mobileSize}
          desktopSize={desktopSize}
          minSize={minSize}
          maxSize={maxSize}
          weight={weight}
          letterSpacing={letterSpacing}
          alignment={alignment}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-4 gap-y-12">
          {visibleArticles.map((article, i) => (
            <ArticleCard
              key={article.id}
              blogHandle={blog.handle}
              article={article}
              loading={getImageLoadingPriority(i, 2)}
              showAuthor={showAuthor}
              showExcerpt={showExcerpt}
              showDate={showDate}
              showReadmore={showReadmore}
              imageAspectRatio={imageAspectRatio}
              imageBorderRadius={imageBorderRadius}
            />
          ))}
        </div>
        {hasMoreArticles && (
          <div className="flex justify-center mt-12">
            <Button onClick={handleLoadMore} variant={buttonVariant}>
              {buttonText}
            </Button>
          </div>
        )}
      </Section>
    );
  }
  return <Section ref={ref} {...rest} />;
});

export interface ArticleCardProps {
  article: ArticleFragment;
  blogHandle: string;
  loading?: HTMLImageElement["loading"];
  showDate: boolean;
  showExcerpt: boolean;
  showAuthor: boolean;
  showReadmore: boolean;
  imageAspectRatio: ImageAspectRatio;
  imageBorderRadius?: string;
  className?: string;
}

export function ArticleCard({
  blogHandle,
  article,
  loading,
  showExcerpt,
  showAuthor,
  showDate,
  showReadmore,
  imageAspectRatio,
  imageBorderRadius,
  className,
}: ArticleCardProps) {
  return (
    <div className={cn("flex flex-col gap-5", className)} style={{"--image-border-radius": imageBorderRadius} as CSSProperties}>
      {article.image && (
        <Link
          to={`/blogs/${blogHandle}/${article.handle}`}
          className="flex flex-col gap-5"
        >
          <Image
            alt={article.image.altText || article.title}
            data={article.image}
            aspectRatio={getImageAspectRatio(article.image, imageAspectRatio)}
            loading={loading}
            sizes="(min-width: 768px) 50vw, 100vw"
            className={"rounded-(--image-border-radius) object-cover"}
          />
        </Link>
      )}
      <div className="space-y-2.5">
        <Link
          to={`/blogs/${blogHandle}/${article.handle}`}
          className="inline-block"
        >
          <RevealUnderline as={"h5"}>{article.title}</RevealUnderline>
        </Link>
        {showExcerpt && (
          <div className="line-clamp-2 lg:line-clamp-3 text-gray-700">
            {article.excerpt}
          </div>
        )}
        <div className="flex items-center gap-2 empty:hidden text-gray-600 mt-2">
          {showDate && <span className="block">{article.publishedAt}</span>}
          {showDate && showAuthor && <span>-</span>}
          {showAuthor && <span className="block">{article.author?.name}</span>}
        </div>
        {showReadmore && (
          <div>
            <Link
              to={`/blogs/${blogHandle}/${article.handle}`}
              variant="underline"
            >
              Read more →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Blogs;

export const schema = createSchema({
  type: "blogs",
  title: "Blogs",
  limit: 1,
  enabledOn: {
    pages: ["BLOG"],
  },
  settings: [
    { group: "Layout", inputs: layoutInputs },
    {
      group: "Heading (optional)",
      inputs: headingInputs.filter(input => input.name !== "content").map((input) => {
        if (input.name === "as") {
          return {
            ...input,
            name: "headingTagName",
          };
        }
        return input;
      }),
    },
    {
      group: "Pagination",
      inputs: [
        {
          type: "range",
          name: "initialCount",
          label: "Initial articles to show",
          defaultValue: 6,
          configs: {
            min: 3,
            max: 12,
            step: 3,
          },
          helpText: "Number of articles to show initially (recommended: 6 for 2 rows of 3 columns)"
        },
        {
          type: "range",
          name: "loadMoreCount",
          label: "Articles to load each time",
          defaultValue: 6,
          configs: {
            min: 3,
            max: 12,
            step: 3,
          },
          helpText: "Number of articles to load when clicking 'Load More'"
        },
      ],
    },
    {
      group: "Load More Button",
      inputs: [
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Load More",
          placeholder: "Load More",
        },
        {
          type: "select",
          name: "buttonVariant",
          label: "Button variant",
          defaultValue: "primary",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "outline", label: "Outline" },
              { value: "decor", label: "Decorative" },
              { value: "custom", label: "Custom" },
            ],
          },
        },
      ],
    },
    {
      group: "Article card",
      inputs: [
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          defaultValue: "1/1",
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
          type: "select",
          name: "imageBorderRadius",
          label: "Image border radius",
          defaultValue: "0px",
          configs: {
            options: [
              { value: "0px", label: "None" },
              { value: "4px", label: "Small (4px)" },
              { value: "8px", label: "Medium (8px)" },
              { value: "12px", label: "Large (12px)" },
              { value: "16px", label: "Extra Large (16px)" },
              { value: "24px", label: "2X Large (24px)" },
              { value: "9999px", label: "Full (rounded)" },
            ],
          },
        },
        {
          type: "switch",
          name: "showExcerpt",
          label: "Show excerpt",
          defaultValue: true,
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
