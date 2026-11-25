import type { ReactNode } from "react";
import { type FetcherWithComponents, useFetcher } from "react-router";

// Aspen's queued cart controls use a shared form envelope on the app-owned
// /cart action. Keep that envelope while executing mutations with the new
// Hydrogen handlers; this also preserves native form submissions.
type FormInputs = Record<string, unknown> & {
  lines?: Array<{ id?: string; merchandiseId?: string; quantity?: number }>;
};
export function CartForm({
  children,
  action,
  inputs,
  route,
  fetcherKey,
}: {
  children:
    | ReactNode
    | ((fetcher: FetcherWithComponents<unknown>) => ReactNode);
  action?: string;
  inputs?: FormInputs;
  route?: string;
  fetcherKey?: string;
}) {
  const fetcher = useFetcher({ key: fetcherKey });
  return (
    <fetcher.Form method="post" action={route || ""}>
      {(action || inputs) && (
        <input
          type="hidden"
          name={CartForm.INPUT_NAME}
          value={JSON.stringify({ action, inputs })}
        />
      )}
      {typeof children === "function" ? children(fetcher) : children}
    </fetcher.Form>
  );
}
CartForm.INPUT_NAME = "cartFormInput";
CartForm.ACTIONS = {
  AttributesUpdateInput: "AttributesUpdateInput",
  BuyerIdentityUpdate: "BuyerIdentityUpdate",
  Create: "Create",
  DiscountCodesUpdate: "DiscountCodesUpdate",
  GiftCardCodesAdd: "GiftCardCodesAdd",
  GiftCardCodesRemove: "GiftCardCodesRemove",
  LinesAdd: "LinesAdd",
  LinesRemove: "LinesRemove",
  LinesUpdate: "LinesUpdate",
  NoteUpdate: "NoteUpdate",
} as const;
CartForm.getFormInput = (
  form: FormData,
): { action?: string; inputs: FormInputs } => {
  const envelope = form.get(CartForm.INPUT_NAME);
  const raw: unknown = envelope ? JSON.parse(String(envelope)) : {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Invalid cart form");
  const parsed = raw as { action?: string; inputs?: FormInputs };
  const inputs: FormInputs = { ...parsed.inputs };
  for (const key of new Set(form.keys())) {
    if (key === CartForm.INPUT_NAME) continue;
    const values = form.getAll(key);
    const value = values.length > 1 ? values : values[0];
    inputs[key] = value === "on" ? true : value === "off" ? false : value;
  }
  return { action: parsed.action, inputs };
};
