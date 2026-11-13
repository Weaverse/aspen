import type { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { loader as loadArticle } from "./($locale).blogs.$articleHandle";

export {
  default,
  headers,
  meta,
  shouldRevalidate,
} from "./($locale).blogs.$articleHandle";

/** Shopify/Studio URLs carry the parent explicitly and load without a redirect. */
export function loader(args: LoaderFunctionArgs) {
  invariant(args.params.blogHandle, "Missing blog handle");
  return loadArticle(args);
}
