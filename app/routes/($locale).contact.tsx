import type { RouteLoaderArgs } from "@weaverse/hydrogen";
import { loader as pageLoader } from "./($locale).pages.$pageHandle";

export {
  default,
  headers,
  meta,
  shouldRevalidate,
} from "./($locale).pages.$pageHandle";

export async function loader(args: RouteLoaderArgs) {
  return pageLoader({
    ...args,
    params: { ...args.params, pageHandle: "contact" },
  });
}
