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

export function isLegacyFooterCopyright(html: string): boolean {
  const plain = footerText(html);
  return (
    /© 20\d{2} Weaverse\.? All rights reserved\.?/i.test(plain) ||
    /© 20(24|25) Aspen Theme\.? Powered by Shopify/i.test(plain)
  );
}
