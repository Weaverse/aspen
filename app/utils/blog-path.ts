import type { MetaDescriptor } from "react-router";

/** Blog identity stays in the query so Aspen's existing paths remain unchanged. */
export function blogPath(handle?: string | null) {
  return handle ? `/blogs?${new URLSearchParams({ blog: handle })}` : "/blogs";
}

export function articlePath(handle: string, blogHandle?: string | null) {
  const path = `/blogs/${encodeURIComponent(handle)}`;
  return blogHandle
    ? `${path}?${new URLSearchParams({ blog: blogHandle })}`
    : path;
}

/** Hydrogen strips all queries by default; `blog` is resource identity here. */
export function blogSeoMeta(
  tags: MetaDescriptor[],
  url?: string,
): MetaDescriptor[] {
  if (!url) {
    return tags;
  }
  const canonical = new URL(url);
  const blog = canonical.searchParams.get("blog");
  if (!blog) {
    return tags;
  }
  canonical.search = new URLSearchParams({ blog }).toString();
  canonical.hash = "";
  return tags.map((tag) =>
    "rel" in tag && tag.rel === "canonical"
      ? { ...tag, href: canonical.toString() }
      : "property" in tag && tag.property === "og:url"
        ? { ...tag, content: canonical.toString() }
        : tag,
  );
}
