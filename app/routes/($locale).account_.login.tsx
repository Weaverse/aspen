import {
  type LoaderFunctionArgs,
  redirect,
  redirectDocument,
} from "react-router";
import { isAccountPreviewRequest } from "~/utils/account-preview.server";
import { customerAccountLoginPath } from "~/utils/customer-account";
import { prefixPathWithLocale } from "~/utils/locale";
import { safeReturnTo } from "~/utils/return-to";

export function loader({ context, request }: LoaderFunctionArgs) {
  const fallback = prefixPathWithLocale(
    "/account",
    context.localization.selectedLocale,
  );
  if (isAccountPreviewRequest(request)) {
    return redirect(safeReturnTo(request, fallback));
  }
  return redirectDocument(
    customerAccountLoginPath(
      safeReturnTo(request, fallback),
      context.localization.selectedLocale,
    ),
  );
}
