import type { CustomerAddressInput } from "@shopify/hydrogen/customer-account-api-types";

/** Validate the country boundary before calling the 2026-10 Customer Account API. */
export function setAddressValue(
  address: CustomerAddressInput,
  key: keyof CustomerAddressInput,
  value: string,
) {
  if (key !== "countryCode") {
    address[key] = value;
    return;
  }
  const country = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw new Error("errors.addressUpdate");
  address.countryCode = country as CustomerAddressInput["countryCode"];
}
