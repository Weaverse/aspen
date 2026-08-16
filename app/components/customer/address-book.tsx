import type { CustomerAddress } from "@shopify/hydrogen/customer-account-api-types";
import type { CustomerDetailsFragment } from "customer-account-api.generated";
import type { HTMLAttributes } from "react";
import { Form } from "react-router";
import { Link } from "~/components/link";
import { cn } from "~/utils/cn";

export function AccountAddressBook({
  customer,
  addresses,
  heading = "ADDRESS BOOK",
  addAddressText = "ADD NEW ADDRESS",
  defaultText = "DEFAULT",
  editText = "EDIT",
  removeText = "REMOVE",
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
  return (
    <div {...rest} className={cn(className)}>
      <h2 className="font-body font-normal text-[#343231] text-sm uppercase leading-5">
        {heading}
      </h2>
      <div className="mt-[13px]">
        {!addresses?.length && (
          <div className="mb-5 bg-white p-5 font-body text-[#343231] text-sm">
            You haven&apos;t saved any addresses yet.
          </div>
        )}
        <div>
          <Link
            to="address/add"
            className="inline-flex h-[54px] min-w-[181px] items-center justify-center bg-white px-6 font-body text-[#343231] text-sm uppercase transition-opacity hover:opacity-70"
          >
            {addAddressText}
          </Link>
        </div>
        {addresses?.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {customer.defaultAddress && (
              <Address
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
  address,
  defaultAddress,
  defaultText,
  editText,
  removeText,
}: {
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
        <Link
          to={`/account/address/${encodeURIComponent(address.id)}`}
          className="transition-opacity hover:opacity-70"
          prefetch="intent"
        >
          {editText}
        </Link>
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
