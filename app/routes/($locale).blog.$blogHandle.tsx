import type { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { loader as loadBlog } from "./($locale).blogs._index";

export {
  default,
  headers,
  meta,
  shouldRevalidate,
} from "./($locale).blogs._index";

/** Studio needs a whole path segment for each selected blog's identity. */
export function loader(args: LoaderFunctionArgs) {
  invariant(args.params.blogHandle, "Missing blog handle");
  return loadBlog(args);
}
