import { ArrowRight } from "@phosphor-icons/react";
import { createSchema } from "@weaverse/hydrogen";
import { type CSSProperties, forwardRef, useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import type {
  BlogArticleFragment,
  BlogsIndexQuery,
} from "storefront-api.generated";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { Section, type SectionProps } from "~/components/section";
import { getImageLoadingPriority } from "~/utils/image";

type JournalArticle = BlogArticleFragment & {
  publishedAtRaw?: string;
};

interface JournalProps extends SectionProps {
  heading?: string;
  description?: string;
  initialCount?: number;
  loadMoreCount?: number;
  loadMoreText?: string;
  readMoreText?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showAuthor?: boolean;
  showFeaturedExcerpt?: boolean;
  showReadMore?: boolean;
  imageBorderRadius?: number;
  accentColor?: string;
  mutedColor?: string;
  linkColor?: string;
  buttonBorderColor?: string;
}

const Journal = forwardRef<HTMLElement, JournalProps>((props, ref) => {
  const {
    heading = "FROM THE BLOG",
    description = "Stories, inspiration, and design notes from the Aspen studio.",
    initialCount = 7,
    loadMoreCount = 3,
    loadMoreText = "LOAD MORE",
    readMoreText = "Read More",
    showCategory = true,
    showDate = true,
    showAuthor = true,
    showFeaturedExcerpt = true,
    showReadMore = true,
    imageBorderRadius = 12,
    accentColor = "#343231",
    mutedColor = "#979797",
    linkColor = "#524B46",
    buttonBorderColor = "#B1B0AF",
    className,
    children: _children,
    ...rest
  } = props;
  const { articles = [] } = useLoaderData<{
    blog: NonNullable<BlogsIndexQuery["blog"]>;
    articles: JournalArticle[];
  }>();
  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [initialCount]);

  const visibleArticles = articles.slice(0, visibleCount);
  const featuredArticle = visibleArticles[0];
  const gridArticles = visibleArticles.slice(1);
  const hasMoreArticles = visibleCount < articles.length;
  const sectionStyle = {
    "--journal-accent": accentColor,
    "--journal-muted": mutedColor,
    "--journal-link": linkColor,
    "--journal-button-border": buttonBorderColor,
    "--journal-radius": `${imageBorderRadius}px`,
  } as CSSProperties;

  const handleLoadMore = () => {
    setVisibleCount((currentCount) =>
      Math.min(currentCount + loadMoreCount, articles.length),
    );
  };

  return (
    <Section
      ref={ref}
      {...rest}
      className={className}
      overflow="unset"
      style={sectionStyle}
      verticalPadding="none"
    >
      <div className="px-0 pt-20 pb-[120px] md:px-2 md:pt-10 md:pb-24 lg:px-0 lg:pt-20 lg:pb-[120px]">
        <header className="mb-16 md:mb-10 lg:mb-16">
          {heading && (
            <h1 className="font-heading font-normal text-[44px] text-(--journal-accent) uppercase leading-[1.1] tracking-[-0.025em]">
              {heading}
            </h1>
          )}
          {description && (
            <p className="mt-3 max-w-[390px] font-body text-sm text-(--journal-muted) leading-[1.45] md:max-w-none">
              {description}
            </p>
          )}
        </header>

        {featuredArticle ? (
          <FeaturedArticle
            article={featuredArticle}
            loading={getImageLoadingPriority(0, 1)}
            readMoreText={readMoreText}
            showAuthor={showAuthor}
            showCategory={showCategory}
            showDate={showDate}
            showExcerpt={showFeaturedExcerpt}
            showReadMore={showReadMore}
          />
        ) : null}

        {gridArticles.length > 0 ? (
          <div className="mt-16 grid grid-cols-1 gap-y-10 md:mt-10 md:grid-cols-3 md:gap-x-8 lg:mt-16 lg:gap-x-5">
            {gridArticles.map((article, index) => (
              <JournalCard
                key={article.id}
                article={article}
                loading={getImageLoadingPriority(index + 1, 2)}
                readMoreText={readMoreText}
                showAuthor={showAuthor}
                showCategory={showCategory}
                showDate={showDate}
                showReadMore={showReadMore}
              />
            ))}
          </div>
        ) : null}

        {hasMoreArticles && (
          <div className="mt-24 flex justify-center md:mt-20 lg:mt-[104px]">
            <button
              type="button"
              onClick={handleLoadMore}
              className="flex min-h-[54px] min-w-[130px] items-center justify-center rounded-lg border border-(--journal-button-border) bg-transparent px-6 font-body font-medium text-(--journal-accent) text-sm uppercase leading-none transition-colors hover:bg-(--color-background-subtle) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--journal-accent)"
            >
              {loadMoreText}
            </button>
          </div>
        )}
      </div>
    </Section>
  );
});

Journal.displayName = "Journal";

interface JournalArticleProps {
  article: JournalArticle;
  loading?: HTMLImageElement["loading"];
  readMoreText: string;
  showAuthor: boolean;
  showCategory: boolean;
  showDate: boolean;
  showReadMore: boolean;
}

interface FeaturedArticleProps extends JournalArticleProps {
  showExcerpt: boolean;
}

function FeaturedArticle({
  article,
  loading,
  readMoreText,
  showAuthor,
  showCategory,
  showDate,
  showExcerpt,
  showReadMore,
}: FeaturedArticleProps) {
  return (
    <article className="group grid grid-cols-1 md:grid-cols-2 md:gap-12 xl:grid-cols-[720px_minmax(0,1fr)] xl:gap-[30px]">
      <ArticleImage article={article} loading={loading} featured />
      <div className="flex flex-col items-start pt-5 md:justify-start md:pt-0 xl:justify-center">
        <ArticleCategory article={article} visible={showCategory} />
        <h2 className="mt-2 font-heading font-normal text-[26px] text-(--journal-accent) leading-[1.08] tracking-[-0.025em] md:mt-3 md:text-[34px] xl:text-[52px] xl:leading-[1.08]">
          <Link
            to={`/blogs/${article.handle}`}
            className="line-clamp-3 transition-opacity hover:opacity-70"
          >
            {article.title}
          </Link>
        </h2>
        <ArticleMeta
          article={article}
          showAuthor={showAuthor}
          showDate={showDate}
          featured
        />
        {showExcerpt && article.excerpt ? (
          <p className="mt-6 hidden max-w-[580px] font-body text-(--journal-link) text-sm leading-[1.45] xl:line-clamp-2">
            {article.excerpt}
          </p>
        ) : null}
        <ReadMoreLink
          article={article}
          text={readMoreText}
          visible={showReadMore}
          className="mt-5 md:mt-6 xl:mt-6"
        />
      </div>
    </article>
  );
}

function JournalCard({
  article,
  loading,
  readMoreText,
  showAuthor,
  showCategory,
  showDate,
  showReadMore,
}: JournalArticleProps) {
  return (
    <article className="group flex min-w-0 flex-col">
      <ArticleImage article={article} loading={loading} />
      <div className="flex flex-col items-start pt-4">
        <ArticleCategory article={article} visible={showCategory} />
        <h3 className="mt-2 font-heading font-normal text-[24px] text-(--journal-accent) leading-[1.12] tracking-[-0.025em] md:text-[27px]">
          <Link
            to={`/blogs/${article.handle}`}
            className="line-clamp-2 transition-opacity hover:opacity-70 md:line-clamp-3 lg:line-clamp-2"
          >
            {article.title}
          </Link>
        </h3>
        <ArticleMeta
          article={article}
          showAuthor={showAuthor}
          showDate={showDate}
        />
        <ReadMoreLink
          article={article}
          text={readMoreText}
          visible={showReadMore}
          className="mt-3"
        />
      </div>
    </article>
  );
}

interface ArticleImageProps {
  article: JournalArticle;
  loading?: HTMLImageElement["loading"];
  featured?: boolean;
}

function ArticleImage({
  article,
  loading,
  featured = false,
}: ArticleImageProps) {
  return (
    <Link
      to={`/blogs/${article.handle}`}
      className="block aspect-video w-full overflow-hidden rounded-(--journal-radius) bg-(--color-background-subtle)"
      data-motion="slide-in"
    >
      {article.image ? (
        <Image
          data={article.image}
          alt={article.image.altText || article.title}
          loading={loading}
          sizes={
            featured
              ? "(min-width: 1280px) 720px, (min-width: 768px) 50vw, calc(100vw - 40px)"
              : "(min-width: 1024px) 440px, (min-width: 768px) 30vw, calc(100vw - 40px)"
          }
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : null}
    </Link>
  );
}

function ArticleCategory({
  article,
  visible,
}: {
  article: JournalArticle;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }
  return (
    <p className="font-body text-[10px] text-(--journal-muted) uppercase leading-[1.2] tracking-[-0.01em]">
      {article.tags?.[0] || "JOURNAL"}
    </p>
  );
}

function ArticleMeta({
  article,
  showAuthor,
  showDate,
  featured = false,
}: {
  article: JournalArticle;
  showAuthor: boolean;
  showDate: boolean;
  featured?: boolean;
}) {
  if (!(showAuthor || showDate)) {
    return null;
  }
  const date = formatArticleDate(article);
  const author = article.author?.name;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[10px] text-(--journal-muted) leading-[1.3] md:text-[11px]">
      {showDate && date ? <time>{date}</time> : null}
      {showDate && showAuthor && date && author && featured ? (
        <span
          className="h-2 w-2 rounded-full bg-(--journal-button-border)"
          aria-hidden="true"
        />
      ) : null}
      {showAuthor && author ? <span>By {author}</span> : null}
    </div>
  );
}

function ReadMoreLink({
  article,
  text,
  visible,
  className,
}: {
  article: JournalArticle;
  text: string;
  visible: boolean;
  className?: string;
}) {
  if (!visible) {
    return null;
  }
  return (
    <Link
      to={`/blogs/${article.handle}`}
      className={`inline-flex items-center gap-2 font-body font-semibold text-(--journal-link) text-sm leading-none transition-opacity hover:opacity-70 ${className || ""}`}
    >
      {text}
      <ArrowRight size={16} weight="regular" aria-hidden="true" />
    </Link>
  );
}

function formatArticleDate(article: JournalArticle) {
  const value = article.publishedAtRaw || article.publishedAt;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return article.publishedAt?.toUpperCase() || "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export default Journal;

export const schema = createSchema({
  type: "journal",
  title: "Journal",
  limit: 1,
  enabled: ({ page }) => page.type === "BLOG",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "FROM THE BLOG",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue:
            "Stories, inspiration, and design notes from the Aspen studio.",
        },
        {
          type: "text",
          name: "readMoreText",
          label: "Read more text",
          defaultValue: "Read More",
        },
      ],
    },
    {
      group: "Articles",
      inputs: [
        {
          type: "range",
          name: "initialCount",
          label: "Initial articles",
          defaultValue: 7,
          configs: { min: 4, max: 16, step: 3 },
          helpText:
            "The first article is featured; remaining articles use a three-column grid.",
        },
        {
          type: "range",
          name: "loadMoreCount",
          label: "Articles per load",
          defaultValue: 3,
          configs: { min: 1, max: 9, step: 1 },
        },
        {
          type: "switch",
          name: "showCategory",
          label: "Show category",
          defaultValue: true,
          helpText: "Uses the article's first tag as its category.",
        },
        {
          type: "switch",
          name: "showDate",
          label: "Show published date",
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
          name: "showFeaturedExcerpt",
          label: "Show featured excerpt on desktop",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showReadMore",
          label: "Show read more links",
          defaultValue: true,
        },
        {
          type: "range",
          name: "imageBorderRadius",
          label: "Image corner radius",
          defaultValue: 12,
          configs: { min: 0, max: 32, step: 2, unit: "px" },
        },
      ],
    },
    {
      group: "Load more",
      inputs: [
        {
          type: "text",
          name: "loadMoreText",
          label: "Button text",
          defaultValue: "LOAD MORE",
        },
      ],
    },
    {
      group: "Colors",
      inputs: [
        {
          type: "color",
          name: "accentColor",
          label: "Heading and title",
          defaultValue: "#343231",
        },
        {
          type: "color",
          name: "mutedColor",
          label: "Category and metadata",
          defaultValue: "#979797",
        },
        {
          type: "color",
          name: "linkColor",
          label: "Read more link",
          defaultValue: "#524B46",
        },
        {
          type: "color",
          name: "buttonBorderColor",
          label: "Button border",
          defaultValue: "#B1B0AF",
        },
      ],
    },
  ],
  presets: {
    heading: "FROM THE BLOG",
    description:
      "Stories, inspiration, and design notes from the Aspen studio.",
    initialCount: 7,
    loadMoreCount: 3,
    loadMoreText: "LOAD MORE",
    readMoreText: "Read More",
    showCategory: true,
    showDate: true,
    showAuthor: true,
    showFeaturedExcerpt: true,
    showReadMore: true,
    imageBorderRadius: 12,
    accentColor: "#343231",
    mutedColor: "#979797",
    linkColor: "#524B46",
    buttonBorderColor: "#B1B0AF",
    width: "fixed",
  },
});
