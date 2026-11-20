import { useTranslation } from "@weaverse/hydrogen";
import {
  type ActionFunctionArgs,
  data,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
} from "react-router";
import Link from "~/components/link";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { prefixPathWithLocale } from "~/utils/locale";
import {
  changeThemivoList,
  checkThemivoPost,
  ThemivoError,
  themivoEnabled,
  themivoErrorKey,
} from "~/utils/themivo-wishlist.server";

export async function loader({ context }: LoaderFunctionArgs) {
  if (!themivoEnabled(context)) {
    throw new Response(null, { status: 404 });
  }
  return { signedIn: await context.customerAccount.isLoggedIn() };
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  if (!themivoEnabled(context) || !params.token) {
    throw new Response(null, { status: 404 });
  }
  try {
    checkThemivoPost(request);
    const form = new FormData();
    form.set("intent", "accept");
    form.set("token", params.token);
    await changeThemivoList(context, form);
    return redirect(
      prefixPathWithLocale("/wishlist", context.localization.selectedLocale),
      303,
    );
  } catch (error) {
    const headers = new Headers({ "Cache-Control": "private, no-store" });
    if (error instanceof ThemivoError && error.retryAfter) {
      headers.set("Retry-After", error.retryAfter);
    }
    return data(
      { error: themivoErrorKey(error) },
      {
        status:
          error instanceof ThemivoError && error.status < 500
            ? error.status
            : 503,
        headers,
      },
    );
  }
}

export default function JoinWishlistPage() {
  const { t } = useTranslation();
  const { signedIn } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const login = usePrefixPathWithLocale("/account/login");
  return (
    <section className="mx-auto flex max-w-[1360px] flex-col gap-6 px-5 py-12 md:px-8">
      <h1>{t("wishlist.join")}</h1>
      {result?.error && <p role="alert">{t(result.error)}</p>}
      {signedIn ? (
        <Form method="post">
          <button
            type="submit"
            className="rounded-lg border border-line-subtle px-3 py-2 disabled:opacity-50"
            disabled={navigation.state !== "idle"}
          >
            {t("wishlist.accept")}
          </button>
        </Form>
      ) : (
        <Link
          reloadDocument
          to={`${login}?return_to=${encodeURIComponent(pathname)}`}
        >
          {t("wishlist.signIn")}
        </Link>
      )}
    </section>
  );
}
