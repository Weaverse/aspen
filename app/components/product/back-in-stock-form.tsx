import { useTranslation } from "@weaverse/hydrogen";
import { useEffect, useState } from "react";
import { useFetcher, useRouteLoaderData } from "react-router";
import { Button } from "~/components/button";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { RootLoader } from "~/root";

type BackInStockResponse = { ok: boolean; error?: string };

export function BackInStockForm({
  variantId,
  availableForSale,
  enabled = true,
}: {
  variantId?: string | null;
  availableForSale?: boolean | null;
  enabled?: boolean;
}) {
  const { t } = useTranslation();
  const rootData = useRouteLoaderData<RootLoader>("root");
  const action = usePrefixPathWithLocale("/api/back-in-stock");
  const fetcher = useFetcher<BackInStockResponse>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const klaviyoConfigured = Boolean(rootData?.integrations?.klaviyo);
  const showForm =
    enabled &&
    klaviyoConfigured &&
    Boolean(variantId) &&
    availableForSale === false;

  useEffect(() => {
    if (!fetcher.data) {
      return;
    }
    if (fetcher.data.ok) {
      setError("");
      setMessage(t("product.backInStockSuccess"));
      return;
    }
    setMessage("");
    setError(fetcher.data.error || t("product.backInStockError"));
  }, [fetcher.data, t]);

  if (!showForm) {
    return null;
  }

  return (
    <div className="space-y-3 border border-line-subtle p-4">
      <div>
        <p className="font-semibold">{t("product.backInStockTitle")}</p>
        <p className="mt-1 text-body-subtle text-sm">
          {t("product.backInStockDescription")}
        </p>
      </div>
      <fetcher.Form
        method="POST"
        action={action}
        encType="multipart/form-data"
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={() => {
          setMessage("");
          setError("");
        }}
      >
        <input type="hidden" name="variantId" value={variantId} />
        <input
          required
          type="email"
          name="email"
          aria-label={t("product.backInStockEmail")}
          placeholder={t("product.backInStockEmail")}
          className="min-h-12 min-w-0 flex-1 border border-line-subtle px-3 outline-hidden focus-visible:border-body"
        />
        <Button
          type="submit"
          className="h-12 shrink-0 px-5 py-0"
          loading={fetcher.state === "submitting"}
          disabled={fetcher.state !== "idle"}
        >
          {t("product.backInStockNotify")}
        </Button>
      </fetcher.Form>
      {error || message ? (
        <div className="text-sm" aria-live="polite">
          {error ? <p className="text-red-700">{error}</p> : null}
          {message ? <p>{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
