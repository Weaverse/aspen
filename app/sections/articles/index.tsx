import {
  IMAGES_PLACEHOLDERS,
  type ComponentLoaderArgs,
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
  type WeaverseBlog,
} from "@weaverse/hydrogen";
import { type VariantProps, cva } from "class-variance-authority";
import clsx from "clsx";
import { type CSSProperties, forwardRef, useState } from "react";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { Button } from "~/components/button";
import { cn } from "~/utils/cn";
import { ArrowRight } from "@phosphor-icons/react";
import { layoutInputs, Section } from "~/components/section";
import { backgroundInputs } from "~/components/background-image";

let fontSizeVariants = cva("", {
  variants: {
    mobileSize: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
      "6xl": "text-6xl",
      "7xl": "text-7xl",
      "8xl": "text-8xl",
      "9xl": "text-9xl",
    },
    desktopSize: {
      xs: "md:text-xs",
      sm: "md:text-sm",
      base: "md:text-base",
      lg: "md:text-lg",
      xl: "md:text-xl",
      "2xl": "md:text-2xl",
      "3xl": "md:text-3xl",
      "4xl": "md:text-4xl",
      "5xl": "md:text-5xl",
      "6xl": "md:text-6xl",
      "7xl": "md:text-7xl",
      "8xl": "md:text-8xl",
      "9xl": "md:text-9xl",
    },
  },
});

let variants = cva("heading", {
  variants: {
    size: {
      default: "",
      custom: "",
      scale: "text-scale",
    },
    weight: {
      "100": "font-thin",
      "200": "font-extralight",
      "300": "font-light",
      "400": "font-normal",
      "500": "font-medium",
      "600": "font-semibold",
      "700": "font-bold",
      "800": "font-extrabold",
      "900": "font-black",
    },
  },
  defaultVariants: {
    size: "default",
    weight: "400",
  },
});

type ArticleData = {
  blogs: WeaverseBlog;
  articlePerRow: number;
  showSeperator: boolean;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  minSize?: number;
  maxSize?: number;
  viewAllText?: string;
  viewAllLink?: string;
  articleHeading?: string;
  accentColor?: string;
  borderRadius?: number;
  showPublishedDate?: boolean;
  // Load More props
  initialCount?: number;
  loadMoreCount?: number;
  buttonVariant?: "primary" | "secondary" | "outline" | "decor" | "custom";
  buttonText?: string;
};

export interface ArticlesProps
  extends HydrogenComponentProps<Awaited<ReturnType<typeof loader>>>,
    ArticleData,
    VariantProps<typeof variants>,
    VariantProps<typeof fontSizeVariants> {}

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
    as: Tag = "h2",
    size,
    mobileSize,
    desktopSize,
    weight,
    minSize,
    maxSize,
    loaderData,
    children,
    viewAllText = "VIEW ALL",
    articleHeading = "ARTICLES",
    accentColor = "#27272A",
    borderRadius = 8,
    showPublishedDate = true,
    // Load More props
    initialCount = 3,
    loadMoreCount = 3,
    buttonVariant = "primary",
    buttonText = "Load More",
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
    setVisibleCount(prev => Math.min(prev + loadMoreCount, res.length));
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
          <h5 className="font-normal uppercase font-heading tracking-wider text-[var(--accent-color)]">
            {articleHeading}
          </h5>
          {viewAllText && (
            <Link
              to={blogs?.handle ? `/blogs/${blogs.handle}` : "#"}
              className="flex items-center gap-2 text-sm cursor-pointer font-medium uppercase tracking-wider text-[var(--accent-color)] hover:opacity-80 transition-opacity"
            >
              {viewAllText}
              <ArrowRight className="w-4 h-4" weight="bold" />
            </Link>
          )}
        </div>
        <div
          className={clsx(
            "grid gap-4",
            articlesPerRowClasses[Math.min(articlePerRow, res?.length || 1)]
          )}
        >
          {visibleArticles?.map((idx, i) => (
            <article key={i} className="group">
              <Link
                to={idx.handle ? `/blogs/${idx.blog.handle}/${idx.handle}` : "#"}
                data-motion="slide-in"
                className="block h-full cursor-pointer"
              >
                <div className="flex w-full h-full flex-col gap-4">
                  {idx.image && (
                    <div className="overflow-hidden rounded-[var(--border-radius)] aspect-square">
                      <Image
                        data={idx.image}
                        sizes="auto"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <Tag
                      className={cn(
                        "font-normal text-[var(--accent-color)]",
                        size === "custom" &&
                          fontSizeVariants({ mobileSize, desktopSize }),
                        variants({ size, weight })
                      )}
                    >
                      {idx.title}
                    </Tag>
                    {showSeperator && (
                      <div className="w-full border-b border-[var(--accent-color)] opacity-20"></div>
                    )}
                    <p className="line-clamp-2 text-[var(--accent-color)] opacity-80">
                      {idx.excerpt}
                    </p>
                    {showPublishedDate && idx.publishedAt && (
                      <div className="flex mt-4 gap-1 text-[var(--accent-color)] text-sm opacity-80">
                        <time className="">
                          {new Date(idx.publishedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </time>
                        —
                        <p>{idx.author?.name}</p>
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
            <Button
              onClick={handleLoadMore}
              variant={buttonVariant}
            >
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
      inputs: layoutInputs.filter((inp) => inp.name !== "divider" && inp.name !== "borderRadius" && inp.name !== "gap"),
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (inp) =>
            inp.name !== "backgroundImage" && inp.name !== "backgroundFit" && inp.name !== "backgroundPosition",
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
          label: "Section heading",
          name: "articleHeading",
          defaultValue: "ARTICLES",
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
          helpText: "Number of articles to show initially"
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
          helpText: "Number of articles to load when clicking 'Load More'"
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
      group: "Heading title (optional)",
      inputs: [
        {
          type: "select",
          name: "as",
          label: "HTML tag",
          configs: {
            options: [
              { value: "h1", label: "<h1> (Heading 1)" },
              { value: "h2", label: "<h2> (Heading 2)" },
              { value: "h3", label: "<h3> (Heading 3)" },
              { value: "h4", label: "<h4> (Heading 4)" },
              { value: "h5", label: "<h5> (Heading 5)" },
              { value: "h6", label: "<h6> (Heading 6)" },
            ],
          },
          defaultValue: "h4",
        },
        {
          type: "select",
          name: "size",
          label: "Text size",
          configs: {
            options: [
              { value: "default", label: "Default" },
              { value: "scale", label: "Auto scale" },
              { value: "custom", label: "Custom" },
            ],
          },
          defaultValue: "default",
        },
        {
          type: "range",
          name: "minSize",
          label: "Minimum scale size",
          configs: {
            min: 12,
            max: 32,
            step: 1,
            unit: "px",
          },
          defaultValue: 16,
          condition: "size.eq.scale",
        },
        {
          type: "range",
          name: "maxSize",
          label: "Maximum scale size",
          configs: {
            min: 40,
            max: 96,
            step: 1,
            unit: "px",
          },
          defaultValue: 64,
          condition: "size.eq.scale",
          helpText:
            'See how scale text works <a href="https://css-tricks.com/snippets/css/fluid-typography/" target="_blank" rel="noreferrer">here</a>.',
        },
        {
          type: "select",
          name: "mobileSize",
          label: "Mobile text size",
          condition: "size.eq.custom",
          configs: {
            options: [
              { value: "xs", label: "Extra small (text-xs)" },
              { value: "sm", label: "Small (text-sm)" },
              { value: "base", label: "Base (text-base)" },
              { value: "lg", label: "Large (text-lg)" },
              { value: "xl", label: "Extra large (text-xl)" },
              { value: "2xl", label: "2x large (text-2xl)" },
              { value: "3xl", label: "3x large (text-3xl)" },
              { value: "4xl", label: "4x large (text-4xl)" },
              { value: "5xl", label: "5x large (text-5xl)" },
              { value: "6xl", label: "6x large (text-6xl)" },
              { value: "7xl", label: "7x large (text-7xl)" },
              { value: "8xl", label: "8x large (text-8xl)" },
              { value: "9xl", label: "9x large (text-9xl)" },
            ],
          },
          defaultValue: "3xl",
        },
        {
          type: "select",
          name: "desktopSize",
          label: "Desktop text size",
          condition: "size.eq.custom",
          configs: {
            options: [
              { value: "xs", label: "Extra small (text-xs)" },
              { value: "sm", label: "Small (text-sm)" },
              { value: "base", label: "Base (text-base)" },
              { value: "lg", label: "Large (text-lg)" },
              { value: "xl", label: "Extra large (text-xl)" },
              { value: "2xl", label: "2x large (text-2xl)" },
              { value: "3xl", label: "3x large (text-3xl)" },
              { value: "4xl", label: "4x large (text-4xl)" },
              { value: "5xl", label: "5x large (text-5xl)" },
              { value: "6xl", label: "6x large (text-6xl)" },
              { value: "7xl", label: "7x large (text-7xl)" },
              { value: "8xl", label: "8x large (text-8xl)" },
              { value: "9xl", label: "9x large (text-9xl)" },
            ],
          },
          defaultValue: "5xl",
        },
        {
          type: "select",
          name: "weight",
          label: "Weight",
          configs: {
            options: [
              { value: "100", label: "100 - Thin" },
              { value: "200", label: "200 - Extra Light" },
              { value: "300", label: "300 - Light" },
              { value: "400", label: "400 - Normal" },
              { value: "500", label: "500 - Medium" },
              { value: "600", label: "600 - Semi Bold" },
              { value: "700", label: "700 - Bold" },
              { value: "800", label: "800 - Extra Bold" },
              { value: "900", label: "900 - Black" },
            ],
          },
          defaultValue: "400",
        },
      ],
    },
  ],
};
