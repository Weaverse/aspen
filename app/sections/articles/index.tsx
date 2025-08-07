import {
  IMAGES_PLACEHOLDERS,
  type ComponentLoaderArgs,
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
  type WeaverseBlog,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import { type CSSProperties, forwardRef, useState } from "react";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { Button } from "~/components/button";
import { ArrowRight } from "@phosphor-icons/react";
import { layoutInputs, Section } from "~/components/section";
import { backgroundInputs } from "~/components/background-image";
import Heading, {
  headingInputs,
  type HeadingProps,
} from "~/components/heading";

type ArticleData = {
  blogs: WeaverseBlog;
  articlePerRow: number;
  showSeperator: boolean;
  viewAllText?: string;
  viewAllLink?: string;
  accentColor?: string;
  borderRadius?: number;
  showPublishedDate?: boolean;
  // Load More props
  initialCount?: number;
  loadMoreCount?: number;
  buttonVariant?: "primary" | "secondary" | "outline" | "decor" | "custom";
  buttonText?: string;
  // Heading props
  headingContent?: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

export interface ArticlesProps
  extends HydrogenComponentProps<Awaited<ReturnType<typeof loader>>>,
    ArticleData,
    Omit<HeadingProps, "content"> {}

let articlesPerRowClasses: { [item: number]: string } = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

const Blogs = forwardRef<HTMLElement, ArticlesProps>((props, ref) => {
  let {
    blogs,
    articlePerRow,
    showSeperator,
    loaderData,
    children,
    viewAllText = "VIEW ALL",
    accentColor = "#27272A",
    borderRadius = 8,
    showPublishedDate = true,
    // Load More props
    initialCount = 3,
    loadMoreCount = 3,
    buttonVariant = "primary",
    buttonText = "Load More",
    // Heading props
    headingContent = "ARTICLES",
    headingTagName = "h5",
    color,
    size,
    mobileSize,
    desktopSize,
    weight,
    letterSpacing,
    alignment,
    minSize,
    maxSize,
    animate,
    ...rest
  } = props;

  // State to manage visible articles count
  const [visibleCount, setVisibleCount] = useState(initialCount);

  let sectionStyle: CSSProperties = {
    "--min-size-px": `${minSize}px`,
    "--min-size": minSize,
    "--max-size": maxSize,
    "--accent-color": accentColor,
    "--border-radius": `${borderRadius}px`,
  } as CSSProperties;

  const defaultArticles = Array.from({ length: 3 }).map((_, i) => ({
    id: i,
    title: "Trendy items for this Winter Fall 2025 season",
    excerpt:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    image: {
      altText: "Placeholder image",
      url: IMAGES_PLACEHOLDERS.collection_6,
      width: 320,
      height: 116,
    },
    handle: null,
  }));

  const res = loaderData?.blog?.articles.nodes ?? defaultArticles;

  // Get visible articles and check if there are more
  const visibleArticles = res.slice(0, visibleCount);
  const hasMoreArticles = visibleCount < res.length;

  // Handle load more
  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + loadMoreCount, res.length));
  };

  return (
    <Section
      ref={ref}
      {...rest}
      className="flex h-full w-full justify-center"
      style={sectionStyle}
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          {headingContent && (
            <Heading
              content={headingContent}
              as={headingTagName}
              color={color || accentColor}
              size={size}
              mobileSize={mobileSize}
              desktopSize={desktopSize}
              weight={weight}
              letterSpacing={letterSpacing}
              alignment={alignment}
              minSize={minSize}
              maxSize={maxSize}
              animate={animate}
              className="uppercase"
            />
          )}
          {viewAllText && (
            <Link
              to={blogs?.handle ? `/blogs/${blogs.handle}` : "#"}
              className="flex items-center justify-center gap-2 text-sm cursor-pointer font-medium uppercase tracking-wider text-(--accent-color) hover:opacity-80 transition-opacity"
            >
              {viewAllText}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="11"
                viewBox="0 0 20 11"
                fill="none"
              >
                <path
                  d="M14.0575 0.376953L13.1737 1.26082L16.9236 5.0107H0.625V6.26074H16.9234L13.1737 10.0105L14.0575 10.8944L19.3163 5.63566L14.0575 0.376953Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          )}
        </div>
        <div
          className={clsx(
            "grid gap-4",
            articlesPerRowClasses[Math.min(articlePerRow, res?.length || 1)],
          )}
        >
          {visibleArticles?.map((idx, i) => (
            <article key={i} className="group">
              <Link
                to={
                  idx.handle ? `/blogs/${idx.blog.handle}/${idx.handle}` : "#"
                }
                data-motion="slide-in"
                className="block h-full cursor-pointer"
              >
                <div className="flex w-full h-full flex-col gap-4">
                  {idx.image && (
                    <div className="overflow-hidden rounded-(--border-radius) aspect-square">
                      <Image
                        data={idx.image}
                        sizes="auto"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <h5 className="font-normal text-(--accent-color) line-clamp-3">
                      {idx.title}
                    </h5>
                    {showSeperator && (
                      <div className="w-full border-b border-(--accent-color) opacity-20"></div>
                    )}
                    <p className="line-clamp-2 text-(--accent-color) opacity-80">
                      {idx.excerpt}
                    </p>
                    {showPublishedDate && idx.publishedAt && (
                      <div className="flex mt-4 gap-1 text-(--accent-color) text-sm opacity-80">
                        <time className="">
                          {new Date(idx.publishedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </time>
                        —<p>{idx.author?.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
        {hasMoreArticles && (
          <div className="flex justify-center mt-8">
            <Button onClick={handleLoadMore} variant={buttonVariant}>
              {buttonText}
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
});

export default Blogs;

export let loader = async (args: ComponentLoaderArgs<ArticleData>) => {
  let { weaverse, data } = args;
  let { storefront, request } = weaverse;
  if (data.blogs) {
    const res = await storefront.query(BLOG_QUERY, {
      variables: {
        blogHandle: data.blogs.handle,
      },
    });
    return res;
  }
};

const BLOG_QUERY = `#graphql
query BlogSingle(
    $language: LanguageCode
    $blogHandle: String!
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      articles(first: 8) {
        nodes {
          author: authorV2 {
            name
          }
          contentHtml
          excerpt
          excerptHtml
          handle
          id
          image {
            id
            altText
            url
            width
            height
          }
          publishedAt
          title
          blog {
            handle
          }
        }
      }
    }
  }
` as const;

export const schema: HydrogenComponentSchema = {
  type: "articles-list",
  title: "Articles",
  inspector: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(
        (inp) =>
          inp.name !== "divider" &&
          inp.name !== "borderRadius" &&
          inp.name !== "gap",
      ),
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (inp) =>
            inp.name !== "backgroundImage" &&
            inp.name !== "backgroundFit" &&
            inp.name !== "backgroundPosition",
        ),
      ],
    },
    {
      group: "Articles",
      inputs: [
        {
          type: "blog",
          name: "blogs",
          label: "Articles",
        },
        {
          type: "color",
          label: "Accent color",
          name: "accentColor",
          defaultValue: "#27272A",
        },
        {
          type: "text",
          label: "View all text",
          name: "viewAllText",
          defaultValue: "VIEW ALL",
        },
        {
          type: "range",
          name: "articlePerRow",
          label: "Articles per row",
          defaultValue: 3,
          configs: {
            min: 1,
            max: 4,
            step: 1,
          },
        },
        {
          type: "range",
          name: "initialCount",
          label: "Initial articles to show",
          defaultValue: 3,
          configs: {
            min: 1,
            max: 8,
            step: 1,
          },
          helpText: "Number of articles to show initially",
        },
        {
          type: "range",
          name: "loadMoreCount",
          label: "Articles to load each time",
          defaultValue: 3,
          configs: {
            min: 1,
            max: 6,
            step: 1,
          },
          helpText: "Number of articles to load when clicking 'Load More'",
        },
        {
          type: "range",
          label: "Border radius",
          name: "borderRadius",
          configs: {
            min: 0,
            max: 24,
            step: 1,
            unit: "px",
          },
          defaultValue: 8,
        },
        {
          type: "switch",
          name: "showSeperator",
          label: "Seperator",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showPublishedDate",
          label: "Show published date",
          defaultValue: true,
        },
      ],
    },
    {
      group: "Heading (optional)",
      inputs: [
        {
          type: "text",
          name: "headingContent",
          label: "Heading content",
          defaultValue: "ARTICLES",
          placeholder: "Enter heading text",
        },
        ...headingInputs.map((input) => {
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
  ],
};
