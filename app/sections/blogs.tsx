import { createSchema } from "@weaverse/hydrogen";
import { forwardRef, type CSSProperties, useState } from "react";
import { useLoaderData } from "react-router";
import type { ArticleFragment, BlogQuery } from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { Button } from "~/components/button";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import Heading, { headingInputs, type HeadingProps } from "~/components/heading";
import type { ImageAspectRatio } from "~/types/image";
import { calculateAspectRatio, getImageLoadingPriority } from "~/utils/image";

interface BlogsProps
  extends Omit<ArticleCardProps, "article" | "blogHandle" | "loading">,
    Omit<HeadingProps, "as" | "content">,
    SectionProps {
  layout: "blog" | "default";
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  showHeading?: boolean;
  imageBorderRadius?: string;
  initialCount?: number;
  loadMoreCount?: number;
  // Button props
  buttonVariant?: "primary" | "secondary" | "outline" | "decor" | "custom";
  buttonText?: string;
  // Articles styling
  accentColor?: string;
  showSeperator?: boolean;
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
    // Articles styling
    accentColor = "#27272A",
    showSeperator = true,
    // Heading props
    showHeading = true,
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
    const sectionStyle: CSSProperties = {
      "--accent-color": accentColor,
      "--border-radius": `${imageBorderRadius}`,
    } as CSSProperties;

    return (
      <Section ref={ref} {...rest} style={sectionStyle}>
        {showHeading && (
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
        )}
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
              showSeperator={showSeperator}
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
  showSeperator?: boolean;
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
  showSeperator,
  imageAspectRatio,
  imageBorderRadius,
  className,
}: ArticleCardProps) {
  return (
    <article className={`group ${className || ""}`}>
      <Link
        to={`/blogs/${blogHandle}/${article.handle}`}
        className="block h-full cursor-pointer"
      >
        <div className="flex w-full h-full flex-col gap-4">
          {article.image && (
            <div 
              className="overflow-hidden aspect-square"
              style={{ borderRadius: imageBorderRadius }}
            >
              <Image
                alt={article.image.altText || article.title}
                data={article.image}
                aspectRatio={calculateAspectRatio(article.image, imageAspectRatio)}
                loading={loading}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex flex-col gap-3">
            <h5 className="font-normal text-(--accent-color) line-clamp-3 tracking-tighter">
              {article.title}
            </h5>
            {showSeperator && (
              <div className="w-full border-b border-(--accent-color) opacity-20"></div>
            )}
            {showExcerpt && (
              <p className="line-clamp-3 text-(--accent-color) opacity-80">
                {article.excerpt}
              </p>
            )}
            {(showDate || showAuthor) && (
              <div className="flex mt-4 gap-1 text-(--accent-color) opacity-80">
                {showDate && (
                  <time>
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long", 
                      day: "numeric",
                    })}
                  </time>
                )}
                {showDate && showAuthor && <span>—</span>}
                {showAuthor && <p>{article.author?.name}</p>}
              </div>
            )}
            {showReadmore && (
              <div className="mt-2">
                <span className="text-(--accent-color) underline opacity-80 hover:opacity-100 transition-opacity uppercase">
                  Read more →
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
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
      inputs: [
        {
          type: "switch",
          name: "showHeading",
          label: "Show heading",
          defaultValue: true,
          helpText: "Toggle to show or hide the blog title heading",
        },
        ...headingInputs.filter(input => input.name !== "content").map((input) => {
          if (input.name === "as") {
            return {
              ...input,
              name: "headingTagName",
            };
          }
          return input;
        }),
      ],
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
      group: "Styling",
      inputs: [
        {
          type: "color",
          label: "Accent color",
          name: "accentColor",
          defaultValue: "#27272A",
        },
        {
          type: "switch",
          name: "showSeperator",
          label: "Show separator",
          defaultValue: true,
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
          defaultValue: "8px",
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
