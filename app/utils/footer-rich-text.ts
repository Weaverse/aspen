import {
  FOOTER_ALLOWED_LINK_ATTRIBUTES,
  FOOTER_ALLOWED_LINK_SCHEMES,
  FOOTER_ALLOWED_TAGS,
} from "~/utils/footer-rich-text-config";

const allowedTags = new Set<string>(FOOTER_ALLOWED_TAGS);
const allowedLinkAttributes = new Set<string>(FOOTER_ALLOWED_LINK_ATTRIBUTES);
const allowedLinkSchemes = new Set<string>(FOOTER_ALLOWED_LINK_SCHEMES);
const blockedWithContents = new Set([
  "script",
  "style",
  "template",
  "noscript",
  "iframe",
  "object",
  "embed",
]);

export function isAllowedFooterHref(href: string): boolean {
  const normalized = Array.from(href.trim())
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 32 && !(code >= 127 && code <= 159);
    })
    .join("")
    .replaceAll("\\", "/");
  if (normalized.startsWith("//")) {
    return false;
  }
  const scheme = normalized.match(/^([a-z][a-z\d+.-]*):/i)?.[1];
  return !scheme || allowedLinkSchemes.has(scheme.toLowerCase());
}

/**
 * Live Studio overrides arrive after the root loader, so they cannot use the
 * server-only sanitizer. Sanitize only those live Footer values with browser
 * primitives; persisted values remain sanitized once in the root loader.
 */
export function sanitizeLiveFooterHtml(html: string): string {
  if (typeof DOMParser === "undefined") {
    return "";
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  const elements = Array.from(document.body.querySelectorAll("*"));

  for (const element of elements) {
    const tag = element.tagName.toLowerCase();
    if (!allowedTags.has(tag)) {
      if (blockedWithContents.has(tag)) {
        element.remove();
      } else {
        element.replaceWith(...Array.from(element.childNodes));
      }
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      if (tag !== "a" || !allowedLinkAttributes.has(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tag === "a") {
      const href = element.getAttribute("href");
      if (href && !isAllowedFooterHref(href)) {
        element.removeAttribute("href");
      }
      element.setAttribute("rel", "noopener noreferrer");
    }
  }

  return document.body.innerHTML;
}

// Persisted Footer HTML is sanitized at the root loader boundary. This helper
// only answers whether sanitized rich text paints any visible content.
function footerText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|#160|#x0*a0);/gi, " ")
    .replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, "x")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasRichText(value?: string): boolean {
  return Boolean(value && footerText(value));
}
