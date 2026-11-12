import { type LoaderFunctionArgs, redirectDocument } from "react-router";
import { customerAccountLoginPath } from "~/utils/customer-account";
export function loader({ context, request }: LoaderFunctionArgs) {
  return redirectDocument(
    customerAccountLoginPath(
      new URL(request.url).searchParams.get("return_to") || "/account",
      context.localization.selectedLocale,
    ),
  );
}
