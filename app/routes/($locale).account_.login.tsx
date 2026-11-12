import { type LoaderFunctionArgs, redirect } from "react-router";
import { isAccountPreviewRequest } from "~/utils/account-preview.server";
import { prefixPathWithLocale } from "~/utils/locale";
import { safeReturnTo } from "~/utils/return-to";

export async function loader({ context, request }: LoaderFunctionArgs) {
  // Customer Account OAuth cannot run on localhost. Stay on the current page
  // (or account preview) instead of returning the tunnel 400/error screen.
  if (isAccountPreviewRequest(request)) {
    return redirect(
      safeReturnTo(
        request,
        prefixPathWithLocale("/account", context.localization.selectedLocale),
      ),
    );
  }

  return context.customerAccount.login();
}
