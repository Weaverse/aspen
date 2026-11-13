import assert from "node:assert/strict";
import test from "node:test";
import { WeaverseClient } from "@weaverse/hydrogen/react-router";
import { build } from "esbuild";

// Keep the actual SDK, normalization and Hydrogen cache implementation in this test.
const bundle = await build({
  stdin: {
    contents:
      'export {loadArticlePage} from "./app/utils/article-page.server";',
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  plugins: [
    {
      name: "sdk",
      setup(b) {
        b.onResolve({ filter: /^[^./~]/ }, (args) => ({
          path: import.meta.resolve(args.path),
          external: true,
        }));
      },
    },
  ],
});
const { loadArticlePage } = await import(
  `data:text/javascript,${encodeURIComponent(bundle.outputFiles[0].text)}`
);

function environment(t, apiBase = "https://studio.weaverse.io") {
  const entries = new Map(),
    waits = [],
    bodies = [];
  const cache = {
    async match(key) {
      return entries.get(key.url)?.clone();
    },
    async put(key, response) {
      entries.set(key.url, response.clone());
    },
  };
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body);
    bodies.push(body);
    const parts = new URL(body.url).pathname.split("/");
    const parent = parts.at(-2);
    return new Response(
      JSON.stringify({
        project: { id: body.projectId, name: "QA" },
        page: {
          id: `page-${parent}`,
          rootId: "root",
          items: [{ id: "root", type: "main", data: {}, children: [] }],
        },
        pageAssignment: {
          id: `assignment-${parent}`,
          pageId: `page-${parent}`,
        },
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  });
  const create = (
    path,
    { projectId = "qa-cms-identity", method = "GET" } = {},
  ) => {
    const request = new Request(`https://store.test${path}`, {
      method,
      headers: { "User-Agent": "Aspen QA" },
      ...(method === "POST" ? { body: "currency=EUR" } : {}),
    });
    return {
      weaverse: new WeaverseClient({
        request,
        storefront: { i18n: { language: "EN", country: "US" } },
        components: [],
        themeSchema: { settings: [] },
        env: {
          WEAVERSE_PROJECT_ID: "env-project",
          WEAVERSE_PUBLIC_API_BASE: apiBase,
        },
        projectId,
        cache,
        waitUntil(promise) {
          waits.push(promise);
        },
      }),
    };
  };
  return {
    create,
    bodies,
    async flush() {
      await Promise.all(waits);
    },
  };
}

test("SDK CMS requests and shared cache distinguish same-handle articles from different blogs", async (t) => {
  const env = environment(t);
  const newsContext = env.create("/blogs/same?blog=news");
  const news = await loadArticlePage(newsContext, {
    blogHandle: "news",
    articleHandle: "same",
  });
  await env.flush();
  const journal = await loadArticlePage(
    env.create("/blogs/same?blog=journal"),
    { blogHandle: "journal", articleHandle: "same" },
  );
  await env.flush();
  assert.equal(news.page.id, "page-news");
  assert.equal(journal.page.id, "page-journal");
  assert.deepEqual(
    env.bodies.map((x) => x.url),
    [
      "https://store.test/blogs/news/same",
      "https://store.test/blogs/journal/same",
    ],
  );
  assert.equal(news.configs.requestInfo.pathname, "/blogs/same");
  assert.equal(news.configs.requestInfo.search, "?blog=news");
  assert.equal(
    newsContext.weaverse.request.url,
    "https://store.test/blogs/same?blog=news",
  );
  const again = await loadArticlePage(
    env.create("/blogs/same?blog=news&utm_source=second"),
    { blogHandle: "news", articleHandle: "same" },
  );
  await env.flush();
  assert.equal(again.page.id, "page-news");
  assert.equal(
    env.bodies.length,
    2,
    "same parent should reuse its cache despite tracking queries",
  );
});

test("SDK scope keeps locale, Studio metadata and the resolved project override", async (t) => {
  const env = environment(t);
  const query =
    "?isDesignMode=true&weaverseProjectId=studio-project&weaverseTemplateId=template-1&weaverseIncarnation=2&blog=news";
  const result = await loadArticlePage(
    env.create(`/fr-fr/blogs/same${query}`),
    { locale: "fr-fr", blogHandle: "news", articleHandle: "same" },
  );
  assert.equal(result.page.id, "page-news");
  const body = env.bodies[0];
  assert.equal(body.projectId, "studio-project");
  const url = new URL(body.url);
  assert.equal(url.pathname, "/fr-fr/blogs/news/same");
  assert.equal(url.searchParams.get("weaverseTemplateId"), "template-1");
  assert.equal(url.searchParams.get("weaverseIncarnation"), "2");
  assert.equal(result.configs.requestInfo.pathname, "/fr-fr/blogs/same");
  const explicit = await loadArticlePage(
    env.create("/blogs/same?blog=news", { projectId: "another-project" }),
    { blogHandle: "news", articleHandle: "same" },
  );
  assert.equal(explicit.project.id, "another-project");
});

test("Studio full paths use the existing client and POST contexts do not transfer a consumed body", async (t) => {
  const env = environment(t);
  const direct = await loadArticlePage(
    env.create("/fr-fr/blogs/news/same?weaverseTemplateId=template-2"),
    { locale: "fr-fr", blogHandle: "news", articleHandle: "same" },
  );
  assert.equal(direct.page.id, "page-news");
  const context = env.create("/blogs/same?blog=news", { method: "POST" });
  await context.weaverse.request.text();
  const short = await loadArticlePage(context, {
    blogHandle: "news",
    articleHandle: "same",
  });
  assert.equal(short.page.id, "page-news");
});

test("external public API requests also preserve parent identity before reaching the upstream cache", async (t) => {
  const env = environment(t, "https://api.weaverse.io");
  for (const parent of ["news", "journal"]) {
    const data = await loadArticlePage(
      env.create(`/blogs/same?blog=${parent}`),
      { blogHandle: parent, articleHandle: "same" },
    );
    assert.equal(data.page.id, `page-${parent}`);
  }
  assert.notEqual(env.bodies[0].url, env.bodies[1].url);
  assert.notDeepEqual(env.bodies[0], env.bodies[1]);
});
