import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getSchema } from "@shopify/hydrogen-codegen";
import { build } from "esbuild";
import { buildClientSchema, parse, validate } from "graphql";

// Exercise the real loaders with only presentation/SEO imports stubbed out.
const stubs = {
  "~/utils/article-page.server": `export async function loadArticlePage(context, params) {
    const data = await context.weaverse.loadPage({type: "ARTICLE", handle: params.articleHandle});
    return {...data, cmsBlog: params.blogHandle};
  }`,
  "~/weaverse": "export const WeaverseContent = () => null;",
  "~/utils/seo.server":
    "export const seoPayload = { article: x => ({url:x.url}), blog: x => ({url:x.url}) };",
  "~/utils/seo-translation": "export const localizedSeoMeta = () => [];",
  "@shopify/hydrogen": `export const flattenConnection = x => x.edges.map(e => e.node);
     export {getSitemap} from '${import.meta.resolve("@shopify/hydrogen")}';`,
};
const bundle = await build({
  stdin: {
    contents: `export {loader as sitemap} from './app/routes/($locale).sitemap.$type.$page[.xml]';
      export {loader as listing} from './app/routes/($locale).blogs._index';
      export {loader as article} from './app/routes/($locale).blogs.$articleHandle';
      export {loader as studioArticle} from './app/routes/($locale).blogs.$blogHandle.$articleHandle';
      export {loader as studioBlog} from './app/routes/($locale).blog.$blogHandle';
      export {themeSchema, getThemeSchema} from './app/weaverse/schema.server';
      export * from './app/utils/blog-path'; export * from './app/utils/blog-sitemap.server';`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  plugins: [
    {
      name: "loader-dependencies",
      setup(b) {
        b.onResolve({ filter: /.*/ }, (args) => {
          if (stubs[args.path]) {
            return { path: args.path, namespace: "stub" };
          }
          if (
            !args.path.startsWith(".") &&
            !args.path.startsWith("/") &&
            !args.path.startsWith("~")
          ) {
            return { path: import.meta.resolve(args.path), external: true };
          }
        });
        b.onLoad({ filter: /.*/, namespace: "stub" }, (args) => ({
          contents: stubs[args.path],
        }));
      },
    },
  ],
});
const {
  listing,
  sitemap,
  article,
  studioArticle,
  studioBlog,
  themeSchema,
  getThemeSchema,
  articlePath,
  blogPath,
  blogSeoMeta,
  qualifyArticleSitemapItems,
} = await import(
  `data:text/javascript,${encodeURIComponent(bundle.outputFiles[0].text)}`
);

function fixture(blogs, path = "/blogs", params = {}, batchSize = 50) {
  const calls = [],
    pages = [];
  const storefront = {
    i18n: { language: "EN", country: "US" },
    CacheShort: () => ({}),
    async query(query, { variables = {} } = {}) {
      calls.push({ query, variables });
      if (query.includes("query FirstMerchantBlog")) {
        return { blogs: { nodes: blogs.slice(0, 1) } };
      }
      if (query.includes("query ArticleParentBlogs")) {
        const start = Number(variables.cursor || 0);
        const slice = blogs.slice(start, start + batchSize);
        return {
          blogs: {
            nodes: slice.map((b) => ({
              handle: b.handle,
              articleByHandle: b.posts[variables.articleHandle] ?? null,
            })),
            pageInfo: {
              hasNextPage: start + batchSize < blogs.length,
              endCursor: String(start + batchSize),
            },
          },
        };
      }
      if (query.includes("query MerchantBlogAlias")) {
        return {
          blog: blogs.find((b) => b.handle === variables.handle) ?? null,
        };
      }
      const blog = blogs.find((b) => b.handle === variables.blogHandle);
      if (!blog) {
        return { blog: null };
      }
      const posts = Object.values(blog.posts).map((p) => ({
        ...p,
        blog: { handle: blog.handle },
      }));
      return {
        blog: {
          ...blog,
          title: blog.handle,
          seo: {},
          articles: { edges: posts.map((node) => ({ node })), nodes: posts },
          articleByHandle: blog.posts[variables.articleHandle] ?? null,
        },
      };
    },
  };
  const context = {
    storefront,
    weaverse: {
      storefront,
      async loadPage(page) {
        pages.push(page);
        return { page };
      },
    },
  };
  return {
    args: {
      request: new Request(`https://store.test${path}`),
      params,
      context,
    },
    calls,
    pages,
  };
}
const post = (handle, title) => ({
  handle,
  title,
  publishedAt: "2026-01-01T00:00:00Z",
  contentHtml: "",
  tags: [],
});
const blog = (handle, posts = {}) => ({ handle, posts });
async function status404(promise) {
  await assert.rejects(
    promise,
    (e) => e instanceof Response && e.status === 404,
  );
}

test("listing resolves a merchant's news blog without any demo lookup", async () => {
  const f = fixture([blog("news", { hello: post("hello", "News") })]);
  const result = await listing(f.args);
  assert.equal(result.data.blog.handle, "news");
  assert.equal(result.data.articles[0].blog.handle, "news");
  assert.deepEqual(f.pages, [{ type: "BLOG", handle: "news" }]);
  assert.ok(f.calls.every((c) => !JSON.stringify(c).includes("aspen-blogs")));
});
test("listing can explicitly select any merchant blog; missing and empty stores return 404", async () => {
  const f = fixture([blog("news"), blog("journal")], "/blogs?blog=journal");
  assert.equal((await listing(f.args)).data.blog.handle, "journal");
  await status404(listing(fixture([], "/blogs").args));
  await status404(listing(fixture([blog("news")], "/blogs?blog=missing").args));
});
test("Studio article paths retain parent and locale without redirecting", async () => {
  const f = fixture(
    [blog("news", { same: post("same", "News post") })],
    "/fr-fr/blogs/news/same?campaign=a&blog=wrong",
    {
      locale: "fr-fr",
      blogHandle: "news",
      articleHandle: "same",
    },
  );
  const result = await studioArticle(f.args);
  assert.equal(result.article.title, "News post");
  assert.equal(result.seo.url, "https://store.test/fr-fr/blogs/same?blog=news");
  assert.equal(result instanceof Response, false);
});
test("same-handle articles resolve correctly from both storefront and Studio paths", async () => {
  const blogs = [
    blog("news", { same: post("same", "News post") }),
    blog("journal", { same: post("same", "Journal post") }),
  ];
  for (const parent of blogs) {
    const direct = await studioArticle(
      fixture(blogs, `/blogs/${parent.handle}/same`, {
        blogHandle: parent.handle,
        articleHandle: "same",
      }).args,
    );
    const result = await article(
      fixture(blogs, articlePath("same", parent.handle), {
        articleHandle: "same",
      }).args,
    );
    assert.equal(direct.article.title, parent.posts.same.title);
    assert.equal(result.article.title, direct.article.title);
    assert.equal(result.blog.handle, parent.handle);
    assert.equal(result.weaverseData.cmsBlog, parent.handle);
    assert.equal(
      new URL(result.seo.url).searchParams.get("blog"),
      parent.handle,
    );
  }
  await status404(
    article(fixture(blogs, "/blogs/same", { articleHandle: "same" }).args),
  );
});
test("Studio blog paths select the page's blog and canonicalize to Aspen's listing", async () => {
  const blogs = [blog("news"), blog("journal")];
  for (const handle of ["news", "journal"]) {
    const f = fixture(blogs, `/fr-fr/blog/${handle}?blog=wrong`, {
      locale: "fr-fr",
      blogHandle: handle,
    });
    const result = await studioBlog(f.args);
    assert.equal(result.data.blog.handle, handle);
    assert.equal(
      result.data.seo.url,
      `https://store.test/fr-fr/blogs?blog=${handle}`,
    );
    assert.deepEqual(f.pages, [{ type: "BLOG", handle }]);
  }
  await status404(
    studioBlog(fixture(blogs, "/blog/missing", { blogHandle: "missing" }).args),
  );
});
test("Studio schema uses supported whole-segment patterns and survives localization", () => {
  assert.deepEqual(themeSchema.routes, { BLOG: "/blog/:handle" });
  const localized = getThemeSchema({
    availableLocales: [],
    defaultLocale: {},
    selectedLocale: { language: "FR" },
  });
  assert.deepEqual(localized.routes, themeSchema.routes);
  assert.ok(
    !("ARTICLE" in themeSchema.routes),
    "Shopify's standard article path needs no override",
  );
});
test("legacy short links resolve across all paginated blogs and reject later duplicate matches", async () => {
  const blogs = [
    blog("empty"),
    blog("news", { hello: post("hello", "News post") }),
  ];
  const f = fixture(blogs, "/blogs/hello", { articleHandle: "hello" }, 1);
  assert.equal((await article(f.args)).article.title, "News post");
  assert.equal(
    f.calls.filter((c) => c.query.includes("query ArticleParentBlogs")).length,
    2,
  );
  blogs.push(blog("journal", { hello: post("hello", "Another post") }));
  await status404(
    article(fixture(blogs, "/blogs/hello", { articleHandle: "hello" }, 1).args),
  );
});
test("an invalid explicit parent never falls back to another blog", async () => {
  const blogs = [
    blog("news", { hello: post("hello", "News") }),
    blog("journal"),
  ];
  await status404(
    article(
      fixture(blogs, "/blogs/hello?blog=journal", { articleHandle: "hello" })
        .args,
    ),
  );
  await status404(
    article(
      fixture(blogs, "/blogs/hello?blog=missing", { articleHandle: "hello" })
        .args,
    ),
  );
});
test("blog aliases retain the selected merchant blog and locale", async () => {
  const f = fixture([blog("news")], "/fr-fr/blogs/news?campaign=a", {
    locale: "fr-fr",
    articleHandle: "news",
  });
  const response = await article(f.args);
  assert.equal(
    response.headers.get("Location"),
    "/fr-fr/blogs?campaign=a&blog=news",
  );
});
test("new links qualify both articles and listings without a special demo handle", () => {
  for (const handle of ["news", "journal", "aspen-blogs"]) {
    assert.equal(articlePath("same", handle), `/blogs/same?blog=${handle}`);
    assert.equal(blogPath(handle), `/blogs?blog=${handle}`);
  }
});

test("canonical and sharing metadata keep blog identity but drop tracking", () => {
  const tags = blogSeoMeta(
    [
      { rel: "canonical", href: "https://store.test/blogs/same" },
      { property: "og:url", content: "https://store.test/blogs/same" },
      { name: "description", content: "Article" },
    ],
    "https://store.test/fr-fr/blogs/same?blog=journal&utm_source=test",
  );
  assert.equal(
    tags[0].href,
    "https://store.test/fr-fr/blogs/same?blog=journal",
  );
  assert.equal(tags[1].content, tags[0].href);
  assert.equal(tags[2].content, "Article");
});

const storefrontSchema = buildClientSchema(
  JSON.parse(readFileSync(getSchema("storefront"), "utf8")),
);
function sitemapApi(blogPages) {
  const calls = [];
  return {
    calls,
    CacheLong: () => ({}),
    async query(document, { variables }) {
      assert.deepEqual(validate(storefrontSchema, parse(document)), []);
      calls.push({ document, variables });
      const index = Number(variables.cursor || 0);
      const handles = Object.entries(variables).filter(([key]) =>
        key.startsWith("handle"),
      );
      return {
        blogs: {
          nodes: blogPages[index].map(({ handle, posts }) =>
            Object.assign(
              { handle },
              Object.fromEntries(
                handles.map(([key, postHandle]) => [
                  key.replace("handle", "article"),
                  posts.includes(postHandle) ? { handle: postHandle } : null,
                ]),
              ),
            ),
          ),
          pageInfo: {
            hasNextPage: index + 1 < blogPages.length,
            endCursor: String(index + 1),
          },
        },
      };
    },
  };
}
test("sitemap resolves duplicate handles across blog pages without attributing another article's timestamp", async () => {
  const api = sitemapApi([
    [{ handle: "news", posts: ["same"] }],
    [{ handle: "journal", posts: ["same"] }],
  ]);
  const items = await qualifyArticleSitemapItems(api, [
    { handle: "same", updatedAt: "2026-01-01" },
    { handle: "same", updatedAt: "2026-11-01" },
  ]);
  assert.deepEqual(
    items.map((x) => x.handle),
    ["news/same", "journal/same"],
  );
  assert.ok(items.every((x) => x.updatedAt === undefined));
  assert.deepEqual(
    api.calls.map((x) => x.variables.cursor),
    [null, "1"],
  );
});
test("a single source row is still ambiguous when another blog owns the same handle", async () => {
  const api = sitemapApi([
    [
      { handle: "news", posts: ["same"] },
      { handle: "journal", posts: ["same"] },
    ],
  ]);
  const items = await qualifyArticleSitemapItems(api, [
    { handle: "same", updatedAt: "2026-01-01" },
  ]);
  assert.equal(items.length, 2);
  assert.ok(items.every((x) => x.updatedAt === undefined));
});
test("sitemap retains the reported timestamp for an unambiguous article", async () => {
  const api = sitemapApi([
    [
      { handle: "news", posts: ["only"] },
      { handle: "journal", posts: [] },
    ],
  ]);
  assert.deepEqual(
    await qualifyArticleSitemapItems(api, [
      { handle: "only", updatedAt: "2026-11-01" },
    ]),
    [{ handle: "news/only", updatedAt: "2026-11-01" }],
  );
});
test("sitemap queries only requested handles in bounded batches, not the article catalog", async () => {
  const handles = Array.from({ length: 11 }, (_, i) => `post-${i}`);
  const api = sitemapApi([[{ handle: "news", posts: handles }]]);
  const items = await qualifyArticleSitemapItems(
    api,
    handles.map((handle) => ({ handle, updatedAt: "2026-11-01" })),
  );
  assert.equal(items.length, 11);
  assert.equal(api.calls.length, 2);
  assert.equal(
    Object.keys(api.calls[0].variables).filter((x) => x.startsWith("handle"))
      .length,
    10,
  );
  assert.equal(
    Object.keys(api.calls[1].variables).filter((x) => x.startsWith("handle"))
      .length,
    1,
  );
  assert.ok(api.calls.every((x) => !/\barticles\s*\(/.test(x.document)));
  const oneItem = sitemapApi([
    [{ handle: "news", posts: ["target", ...handles] }],
  ]);
  await qualifyArticleSitemapItems(oneItem, [
    { handle: "target", updatedAt: "2026-11-01" },
  ]);
  assert.equal(oneItem.calls.length, 1);
  const empty = sitemapApi([]);
  assert.deepEqual(await qualifyArticleSitemapItems(empty, []), []);
  assert.equal(empty.calls.length, 0);
});
test("localized article redirects replace only the article segment, retaining parent, locale and query", async () => {
  const blogs = [blog("news", { news: post("nouvelles", "French post") })];
  const f = fixture(blogs, "/fr-fr/blogs/news/news?utm_source=test", {
    locale: "fr-fr",
    blogHandle: "news",
    articleHandle: "news",
  });
  await assert.rejects(studioArticle(f.args), (response) => {
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://store.test/fr-fr/blogs/news/nouvelles?utm_source=test",
    );
    return true;
  });
  const short = fixture(
    [blog("news", { fr: post("francais", "French") })],
    "/fr-fr/blogs/fr?blog=news&tracking=1",
    { locale: "fr-fr", articleHandle: "fr" },
  );
  await assert.rejects(article(short.args), (response) => {
    assert.equal(
      response.headers.get("Location"),
      "https://store.test/fr-fr/blogs/francais?blog=news&tracking=1",
    );
    return true;
  });
});

test("sitemap XML omits unknown lastmod, retaining unique dates and valid response headers", async () => {
  const api = sitemapApi([
    [
      { handle: "news", posts: ["same", "only"] },
      { handle: "journal", posts: ["same"] },
    ],
  ]);
  const lookup = api.query.bind(api);
  api.query = async (document, options) =>
    document.includes("query SitemapArticles")
      ? {
          sitemap: {
            resources: {
              items: [
                { handle: "same", updatedAt: "2026-01-01T00:00:00Z" },
                { handle: "same", updatedAt: "2026-11-01T00:00:00Z" },
                { handle: "only", updatedAt: "2026-10-01T00:00:00Z" },
              ],
            },
          },
        }
      : lookup(document, options);
  const response = await sitemap({
    request: new Request("https://store.test/sitemap/articles/1.xml"),
    params: { type: "articles", page: "1" },
    context: { storefront: api },
  });
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/xml");
  assert.match(xml, /<loc>https:\/\/store.test\/blogs\/same\?blog=news<\/loc>/);
  assert.match(
    xml,
    /<loc>https:\/\/store.test\/blogs\/same\?blog=journal<\/loc>/,
  );
  assert.equal((xml.match(/<lastmod>/g) ?? []).length, 1);
  assert.match(xml, /<lastmod>2026-10-01T00:00:00Z<\/lastmod>/);
  assert.ok(!xml.includes("undefined"));
});
