export const FOOTER_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "span",
  "a",
  "ul",
  "ol",
  "li",
] as const;

export const FOOTER_ALLOWED_LINK_ATTRIBUTES = [
  "href",
  "title",
  "target",
  "rel",
] as const;

export const FOOTER_ALLOWED_LINK_SCHEMES = [
  "https",
  "http",
  "mailto",
  "tel",
] as const;
