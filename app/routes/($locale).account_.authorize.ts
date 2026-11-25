import { type LoaderFunctionArgs, redirectDocument } from "react-router";
export function loader({ request }: LoaderFunctionArgs) {
  return redirectDocument("/account/authorize" + new URL(request.url).search);
}
