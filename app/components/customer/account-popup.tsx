import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import type { CustomerAddress } from "@shopify/hydrogen/customer-account-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import type { CustomerDetailsFragment } from "customer-account-api.generated";
import { type ReactNode, useEffect, useState } from "react";
import { createPath, useFetcher } from "react-router";
import { useHrefWithLocale } from "~/components/link";
import { translateError } from "~/utils/translated-error";

export function AccountPopup({
  children,
  customer,
  address,
  mode,
}: {
  children: ReactNode;
  customer?: CustomerDetailsFragment;
  address?: CustomerAddress;
  mode: "account" | "add" | "address";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      {open && (
        <AccountPopupContent
          customer={customer}
          address={address}
          mode={mode}
          onSaved={() => setOpen(false)}
        />
      )}
    </Dialog.Root>
  );
}

function AccountPopupContent({
  customer,
  address,
  mode,
  onSaved,
}: {
  customer?: CustomerDetailsFragment;
  address?: CustomerAddress;
  mode: "account" | "add" | "address";
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const fetcher = useFetcher<{ success?: boolean; formError?: string }>();
  const action = useHrefWithLocale(
    mode === "account"
      ? "/account/edit?modal=1"
      : `/account/address/${encodeURIComponent(address?.id || "add")}?modal=1`,
  );
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      onSaved();
    }
  }, [fetcher.state, fetcher.data, onSaved]);
  const fields =
    mode === "account"
      ? [
          {
            name: "firstName",
            label: "account.firstName",
            value: customer?.firstName,
            autoComplete: "given-name",
          },
          {
            name: "lastName",
            label: "account.lastName",
            value: customer?.lastName,
            autoComplete: "family-name",
          },
          {
            name: "email",
            label: "account.email",
            value: customer?.emailAddress?.emailAddress,
            autoComplete: "email",
          },
        ]
      : [
          {
            name: "firstName",
            label: "account.firstName",
            value: address?.firstName,
            autoComplete: "given-name",
          },
          {
            name: "lastName",
            label: "account.lastName",
            value: address?.lastName,
            autoComplete: "family-name",
          },
          {
            name: "company",
            label: "account.company",
            value: address?.company,
            autoComplete: "organization",
          },
          {
            name: "address1",
            label: "account.addressLine1",
            value: address?.address1,
            autoComplete: "address-line1",
          },
          {
            name: "address2",
            label: "account.addressLine2",
            value: address?.address2,
            autoComplete: "address-line2",
          },
          {
            name: "city",
            label: "account.city",
            value: address?.city,
            autoComplete: "address-level2",
          },
          {
            name: "zoneCode",
            label: "account.stateProvince",
            value: address?.zoneCode,
            autoComplete: "address-level1",
          },
          {
            name: "territoryCode",
            label: "account.countryCode",
            value: address?.territoryCode,
            autoComplete: "country",
          },
          {
            name: "zip",
            label: "account.postalCode",
            value: address?.zip,
            autoComplete: "postal-code",
          },
          {
            name: "phoneNumber",
            label: "account.phone",
            value: address?.phoneNumber,
            autoComplete: "tel",
          },
        ];
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <Dialog.Content
        aria-describedby={undefined}
        className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-32px)] w-[436px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-white p-6 text-[#343231]"
      >
        <Dialog.Title className="mb-6 pr-7 font-heading text-[26px] font-normal uppercase leading-[1.1] tracking-[-0.52px]">
          {t(
            mode === "account"
              ? "account.editAccount"
              : mode === "add"
                ? "account.addAddress"
                : "account.editAddress",
          )}
        </Dialog.Title>
        <Dialog.Close
          className="absolute top-6 right-6 flex size-6 items-center justify-center text-[#7F8B52]"
          aria-label={t("account.closeModal")}
        >
          <XIcon size={16} weight="light" />
        </Dialog.Close>
        <fetcher.Form
          method="post"
          action={typeof action === "string" ? action : createPath(action)}
          className="flex flex-col gap-3"
        >
          {mode !== "account" && (
            <input
              type="hidden"
              name="addressId"
              value={address?.id || "add"}
            />
          )}
          {fetcher.data?.formError && (
            <p role="alert" className="bg-red-50 p-3 text-sm text-red-900">
              {translateError(t, fetcher.data.formError)}
            </p>
          )}
          {fields.map((field) => (
            <input
              key={field.name}
              name={field.name}
              aria-label={t(field.label)}
              placeholder={t(field.label)}
              defaultValue={field.value || ""}
              autoComplete={field.autoComplete}
              readOnly={field.name === "email"}
              type={
                field.name === "email"
                  ? "email"
                  : field.name === "phoneNumber"
                    ? "tel"
                    : "text"
              }
              required={
                mode !== "account" &&
                [
                  "firstName",
                  "lastName",
                  "address1",
                  "city",
                  "territoryCode",
                  "zip",
                ].includes(field.name)
              }
              className="h-[54px] w-full rounded-lg border border-[#9CA873] bg-white px-4 font-body text-sm placeholder:text-[#979797] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7F8B52]"
            />
          ))}
          {mode !== "account" && (
            <label className="flex items-center gap-4 font-body text-sm">
              <input
                type="checkbox"
                name="defaultAddress"
                defaultChecked={
                  address !== undefined &&
                  customer?.defaultAddress?.id === address.id
                }
                className="size-5 accent-[#4D4946]"
              />
              {t("account.setDefaultAddress")}
            </label>
          )}
          <div className="mt-3 flex justify-end gap-3">
            <Dialog.Close className="h-[54px] rounded-lg border border-[#B7B7B7] px-6 font-body text-sm font-semibold uppercase">
              {t("account.cancel")}
            </Dialog.Close>
            <button
              type="submit"
              disabled={fetcher.state !== "idle"}
              className="h-[54px] rounded-lg bg-[#4D4946] px-6 font-body text-sm font-semibold text-[#FEF4EB] uppercase disabled:opacity-50"
            >
              {t(
                fetcher.state !== "idle"
                  ? "account.saving"
                  : mode === "add"
                    ? "account.add"
                    : "account.save",
              )}
            </button>
          </div>
        </fetcher.Form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
