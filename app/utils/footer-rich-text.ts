import sanitizeHtml from "sanitize-html";

/** Footer prose supports formatting and links, but no executable HTML. */
export function sanitizeFooterHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
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
    ],
    allowedAttributes: { a: ["href", "title", "target", "rel"] },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: { ...attributes, rel: "noopener noreferrer" },
      }),
    },
  });
}

// This string is for content checks only, never for rendering as HTML.
function footerText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter: (text) => `${text} `,
  })
    .replace(/\s+/g, " ")
    .trim();
}

export function hasRichText(value?: string): boolean {
  return Boolean(value && footerText(value));
}
