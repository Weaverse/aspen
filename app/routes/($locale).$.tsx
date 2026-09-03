import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { getLocalizedMeta } from "~/utils/metadata";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { validateWeaverseData, WeaverseContent } from "~/weaverse";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export const meta: MetaFunction = ({ params }) =>
  getLocalizedMeta({ locale: params.locale, page: "page" });

export async function loader({ context }: LoaderFunctionArgs) {
  const weaverseData = await context.weaverse.loadPage({
    type: "CUSTOM",
  });

  validateWeaverseData(weaverseData);

  return {
    weaverseData,
  };
}

export default function Component() {
  return <WeaverseContent />;
}
