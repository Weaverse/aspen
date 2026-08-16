import type { LoaderFunctionArgs } from "react-router";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { validateWeaverseData, WeaverseContent } from "~/weaverse";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

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
