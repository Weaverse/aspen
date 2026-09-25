/** Shopify wraps the matching query in `<mark>`, which browsers paint yellow. */
export function normalizeSearchStyledText(html: string) {
  return html.replace(/<mark\b[^>]*>/gi, "<b>").replace(/<\/mark>/gi, "</b>");
}
