import { ArrowRight } from "@phosphor-icons/react";
import {
  type ComponentLoaderArgs,
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
  IMAGES_PLACEHOLDERS,
  type WeaverseBlog,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import { type CSSProperties, forwardRef, useState } from "react";
import { backgroundInputs } from "~/components/background-image";
import { Button } from "~/components/button";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { layoutInputs, Section } from "~/components/section";

type ArticleData = {
  blogs: WeaverseBlog;
  articlePerRow: number;
  showSeperator: boolean;
  viewAllText?: string;
  viewAllLink?: string;
  accentColor?: string;
  borderRadius?: number;
  showPublishedDate?: boolean;
  showCategory?: boolean;
  showReadMore?: boolean;
  readMoreText?: string;
  enableLoadMore?: boolean;
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
    accentColor = "#343231",
    borderRadius = 8,
    showPublishedDate = true,
    showCategory = true,
    showReadMore = true,
    readMoreText = "Read More",
    enableLoadMore = false,
    // Load More props
    initialCount = 3,
    loadMoreCount = 3,
    buttonVariant = "primary",
    buttonText = "Load More",
    // Heading props
    headingContent = "ARTICLES",
    headingTagName = "h2",
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

  const defaultArticles = [
    {
      id: 1,
      title: "Summer Florals in the Modern Home",
      excerpt:
        "A considered guide to warm materials, balanced proportions, and rooms designed around daily life.",
      image: {
        altText: "A calm, naturally styled living room",
        url: IMAGES_PLACEHOLDERS.collection_6,
        width: 640,
        height: 480,
      },
      handle: null,
      tags: ["DESIGN"],
      publishedAt: "2025-08-12T00:00:00Z",
      author: { name: "Rylan Holden" },
    },
    {
      id: 2,
      title: "The Art of Minimalist Layering",
      excerpt:
        "Why solid wood, linen, and tactile finishes only grow more beautiful with time.",
      image: {
        altText: "Natural furniture materials and textures",
        url: IMAGES_PLACEHOLDERS.collection_5,
        width: 640,
        height: 480,
      },
      handle: null,
      tags: ["INSPIRATION"],
      publishedAt: "2025-07-28T00:00:00Z",
      author: { name: "Sarah Jenkins" },
    },
    {
      id: 3,
      title: "Curating a Calm Morning Routine",
      excerpt:
        "Simple ways to make the everyday moments around your home feel more intentional.",
      image: {
        altText: "A thoughtfully arranged home interior",
        url: IMAGES_PLACEHOLDERS.collection_4,
        width: 640,
        height: 480,
      },
      handle: null,
      tags: ["INTERIORS"],
      publishedAt: "2025-06-16T00:00:00Z",
      author: { name: "Marcus Thorne" },
    },
  ];

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
      <div className="flex w-full flex-col gap-10 lg:gap-12">
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
              className="text-[28px] leading-none uppercase lg:text-[36px]"
            />
          )}
          {viewAllText && (
            <Link
              to={blogs?.handle ? `/blogs/${blogs.handle}` : "#"}
              className="flex cursor-pointer items-center justify-center gap-2 font-normal text-(--accent-color) text-[10px] uppercase tracking-[0.08em] transition-opacity hover:opacity-70 lg:text-xs"
            >
              {viewAllText}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="10"
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
            "grid gap-x-5 gap-y-8",
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
                <div className="flex h-full w-full flex-col gap-3">
                  {idx.image && (
                    <div className="aspect-video overflow-hidden rounded-(--border-radius)">
                      <Image
                        data={idx.image}
                        sizes="(min-width: 1024px) 440px, (min-width: 640px) 50vw, calc(100vw - 40px)"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-col items-start gap-1.5">
                    {showCategory && (
                      <p className="text-(--accent-color) text-[9px] uppercase tracking-[0.08em] opacity-60">
                        {idx.tags?.[0] ||
                          ["DESIGN", "INSPIRATION", "INTERIORS"][i % 3]}
                      </p>
                    )}
                    <h3 className="line-clamp-2 font-normal text-(--accent-color) text-lg leading-[1.15] lg:text-xl">
                      {idx.title}
                    </h3>
                    {showSeperator && (
                      <div className="w-full border-(--accent-color) border-b opacity-20" />
                    )}
                    {showPublishedDate && idx.publishedAt && (
                      <div className="flex gap-1 text-(--accent-color) text-[9px] uppercase tracking-[0.03em] opacity-50">
                        <time>
                          {new Date(idx.publishedAt)
                            .toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                            .toUpperCase()}
                        </time>
                        <span aria-hidden="true">—</span>
                        <p>{idx.author?.name}</p>
                      </div>
                    )}
                    {showReadMore && (
                      <span className="mt-1 flex items-center gap-1.5 text-[10px] leading-none">
                        {readMoreText}
                        <ArrowRight size={11} weight="regular" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
        {enableLoadMore && hasMoreArticles && (
          <div className="mt-8 flex justify-center">
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
      articles(first: 10) {
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
          tags
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
  settings: [
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
          defaultValue: "#343231",
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
            max: 10,
            step: 1,
          },
          helpText: "Number of articles to show initially (max 10 available)",
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
        {
          type: "switch",
          name: "showCategory",
          label: "Show article category",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showReadMore",
          label: "Show read more link",
          defaultValue: true,
        },
        {
          type: "text",
          name: "readMoreText",
          label: "Read more text",
          defaultValue: "Read More",
          condition: "showReadMore.eq.true",
        },
        {
          type: "switch",
          name: "enableLoadMore",
          label: "Enable load more",
          defaultValue: false,
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
  presets: {
    width: "fixed",
    verticalPadding: "medium",
    accentColor: "#343231",
    headingContent: "ARTICLES",
    headingTagName: "h2",
    weight: "400",
    letterSpacing: "tight",
    articlePerRow: 3,
    initialCount: 3,
    loadMoreCount: 3,
    borderRadius: 8,
    showSeperator: false,
    showPublishedDate: true,
    showCategory: true,
    showReadMore: true,
    readMoreText: "Read More",
    enableLoadMore: false,
    viewAllText: "VIEW ALL",
    buttonVariant: "secondary",
    buttonText: "LOAD MORE",
  },
};
