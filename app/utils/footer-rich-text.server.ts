import type { ThemeSettingsResponse } from "@weaverse/hydrogen";
import sanitizeHtml from "sanitize-html";
import {
  FOOTER_ALLOWED_LINK_ATTRIBUTES,
  FOOTER_ALLOWED_LINK_SCHEMES,
  FOOTER_ALLOWED_TAGS,
} from "~/utils/footer-rich-text-config";

const FOOTER_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...FOOTER_ALLOWED_TAGS],
  allowedAttributes: { a: [...FOOTER_ALLOWED_LINK_ATTRIBUTES] },
  allowedSchemes: [...FOOTER_ALLOWED_LINK_SCHEMES],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attributes) => ({
      tagName,
      attribs: { ...attributes, rel: "noopener noreferrer" },
    }),
  },
};

/** Footer prose supports formatting and links, but no executable HTML. */
export function sanitizeFooterHtml(html: string): string {
  return sanitizeHtml(html, FOOTER_HTML_OPTIONS);
}

function sanitizeNestedString(
  source: Record<string, unknown> | undefined,
  path: string[],
): Record<string, unknown> | undefined {
  if (!source) {
    return source;
  }
  const [part, ...rest] = path;
  if (!Object.hasOwn(source, part)) {
    return source;
  }
  const current = source[part];
  if (rest.length === 0) {
    return typeof current === "string"
      ? { ...source, [part]: sanitizeFooterHtml(current) }
      : source;
  }
  if (!current || typeof current !== "object") {
    return source;
  }
  const sanitized = sanitizeNestedString(
    current as Record<string, unknown>,
    rest,
  );
  return sanitized === current ? source : { ...source, [part]: sanitized };
}

function sanitizePaths(
  source: Record<string, unknown> | undefined,
  paths: string[][],
) {
  return paths.reduce(
    (result, path) => sanitizeNestedString(result, path),
    source,
  );
}

const THEME_HTML_PATHS = [["bio"], ["copyright"]];
const TRANSLATION_HTML_PATHS = [
  ["themeSettings", "bio"],
  ["themeSettings", "copyright"],
  ["themeContent", "componentsLayoutFooter", "bio"],
  ["themeContent", "componentsLayoutFooter", "copyright"],
];

/** Sanitize footer HTML once before root-loader data reaches React or the browser. */
export function sanitizeFooterTheme(
  response: ThemeSettingsResponse,
): ThemeSettingsResponse {
  return {
    ...response,
    theme: sanitizePaths(response.theme, THEME_HTML_PATHS),
    staticContent: sanitizePaths(
      response.staticContent,
      TRANSLATION_HTML_PATHS,
    ),
    merchantOverrides: sanitizePaths(
      response.merchantOverrides,
      TRANSLATION_HTML_PATHS,
    ),
  };
}
