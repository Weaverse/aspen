import type { CustomerAddress } from "@shopify/hydrogen/customer-account-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import type { CustomerDetailsFragment } from "customer-account-api.generated";
import type { HTMLAttributes } from "react";
import { Form } from "react-router";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { cn } from "~/utils/cn";
import { AccountPopup } from "./account-popup";

export function AccountAddressBook({
  customer,
  addresses,
  heading: rawI18nHeading = "ADDRESS BOOK",
  addAddressText: rawI18nAddAddressText = "ADD NEW ADDRESS",
  defaultText: rawI18nDefaultText = "DEFAULT",
  editText: rawI18nEditText = "EDIT",
  removeText: rawI18nRemoveText = "REMOVE",
  className,
  ...rest
}: {
  customer: CustomerDetailsFragment;
  addresses: CustomerAddress[];
  heading?: string;
  addAddressText?: string;
  defaultText?: string;
  editText?: string;
  removeText?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const translateText = useTranslatedText();
  const heading = translateText(
    rawI18nHeading,
    "themeContent.componentsCustomerAddressBook.heading",
  );
  const addAddressText = translateText(
    rawI18nAddAddressText,
    "themeContent.componentsCustomerAddressBook.addAddressText",
  );
  const defaultText = translateText(
    rawI18nDefaultText,
    "themeContent.componentsCustomerAddressBook.defaultText",
  );
  const editText = translateText(
    rawI18nEditText,
    "themeContent.componentsCustomerAddressBook.editText",
  );
  const removeText = translateText(
    rawI18nRemoveText,
    "themeContent.componentsCustomerAddressBook.removeText",
  );

  const { t } = useTranslation();
  return (
    <div {...rest} className={cn(className)}>
      <h2 className="font-body font-normal text-[#343231] text-sm uppercase leading-5 tracking-[0.02em]">
        {heading}
      </h2>
      <div className="mt-[13px]">
        {!addresses?.length && (
          <div className="mb-5 bg-white p-5 font-body text-[#343231] text-sm">
            {t("account.noAddresses")}
          </div>
        )}
        <div>
          <AccountPopup customer={customer} mode="add">
            <button
              type="button"
              className="inline-flex h-[54px] min-w-[181px] items-center justify-center bg-white px-6 font-body text-[#343231] text-sm uppercase transition-opacity hover:opacity-70"
            >
              {addAddressText}
            </button>
          </AccountPopup>
        </div>
        {addresses?.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {customer.defaultAddress && (
              <Address
                customer={customer}
                address={customer.defaultAddress}
                defaultAddress
                defaultText={defaultText}
                editText={editText}
                removeText={removeText}
              />
            )}
            {addresses
              .filter((address) => address.id !== customer.defaultAddress?.id)
              .map((address) => (
                <Address
                  customer={customer}
                  key={address.id}
                  address={address}
                  defaultText={defaultText}
                  editText={editText}
                  removeText={removeText}
                />
              ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Address({
  customer,
  address,
  defaultAddress,
  defaultText,
  editText,
  removeText,
}: {
  customer: CustomerDetailsFragment;
  address: CustomerAddress;
  defaultAddress?: boolean;
  defaultText: string;
  editText: string;
  removeText: string;
}) {
  const fullName =
    `${address.firstName || ""} ${address.lastName || ""}`.trim();
  const formattedLines = (address.formatted || []).filter(
    (line) => line.trim().toLowerCase() !== fullName.toLowerCase(),
  );

  return (
    <div className="flex min-h-[206px] flex-col bg-white p-5 font-body text-[#343231] text-sm leading-[22px]">
      {defaultAddress && (
        <div className="mb-4 flex flex-row">
          <span className="inline-flex h-[27px] min-w-[70px] items-center justify-center bg-[#4D4946] px-2.5 font-normal text-[#343231] text-xs uppercase leading-none">
            {defaultText}
          </span>
        </div>
      )}
      <ul className="flex-1">
        {fullName && (
          <li className="mb-2 font-semibold leading-5">{fullName}</li>
        )}
        {formattedLines.map((line: string) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="mt-auto flex flex-row items-center gap-4 text-[#979797] text-xs uppercase leading-5">
        <AccountPopup customer={customer} address={address} mode="address">
          <button type="button" className="transition-opacity hover:opacity-70">
            {editText}
          </button>
        </AccountPopup>
        <Form action="address/delete" method="delete">
          <input type="hidden" name="addressId" value={address.id} />
          <button
            type="submit"
            className="text-[#979797] text-xs uppercase leading-5 transition-opacity hover:opacity-70"
          >
            {removeText}
          </button>
        </Form>
      </div>
    </div>
  );
}
