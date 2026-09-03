import type { CustomerAddressInput } from "@shopify/hydrogen/customer-account-api-types";
import type {
  CustomerAddressCreateMutation,
  CustomerAddressDeleteMutation,
  CustomerAddressUpdateMutation,
} from "customer-account-api.generated";
import {
  type ActionFunction,
  data,
  type MetaFunction,
  redirect,
} from "react-router";
import invariant from "tiny-invariant";
// biome-ignore lint/style/noExportedImports: <explanation> --- IGNORE ---
import { AccountEditAddressForm } from "~/components/customer/edit-address-form";
import {
  type AccountPreviewAddress,
  accountPath,
  commitAccountPreviewState,
  isAccountPreviewRequest,
  readAccountPreviewState,
} from "~/utils/account-preview.server";
import { getLocalizedMeta } from "~/utils/metadata";
import { doLogout } from "./($locale).account_.logout";

export const handle = {
  renderInModal: true,
};

export const meta: MetaFunction = ({ params }) =>
  getLocalizedMeta({ locale: params.locale, page: "editAddress" });

export const action: ActionFunction = async ({ request, context, params }) => {
  const { customerAccount } = context;
  const formData = await request.formData();

  if (isAccountPreviewRequest(request)) {
    return handlePreviewAddressAction(request, formData, params.locale);
  }

  // Double-check current user is logged in.
  // Will throw a logout redirect if not.
  if (!(await customerAccount.isLoggedIn())) {
    throw await doLogout(context);
  }

  const addressId = formData.get("addressId");
  invariant(typeof addressId === "string", "You must provide an address id.");

  if (request.method === "DELETE") {
    try {
      const { data: deleteData, errors } =
        await customerAccount.mutate<CustomerAddressDeleteMutation>(
          DELETE_ADDRESS_MUTATION,
          { variables: { addressId } },
        );

      invariant(!errors?.length, errors?.[0]?.message);

      invariant(
        !deleteData?.customerAddressDelete?.userErrors?.length,
        deleteData?.customerAddressDelete?.userErrors?.[0]?.message,
      );

      invariant(
        deleteData?.customerAddressDelete?.deletedAddressId,
        "Expected customer address to be deleted",
      );

      return redirect(accountPath(params.locale));
    } catch (error: any) {
      return data(
        { formError: error.message },
        {
          status: 400,
        },
      );
    }
  }

  const address: CustomerAddressInput = {};

  const keys: (keyof CustomerAddressInput)[] = [
    "lastName",
    "firstName",
    "address1",
    "address2",
    "city",
    "zoneCode",
    "territoryCode",
    "zip",
    "phoneNumber",
    "company",
  ];

  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") {
      address[key] = value;
    }
  }

  const defaultAddress = formData.has("defaultAddress")
    ? String(formData.get("defaultAddress")) === "on"
    : false;

  if (addressId === "add") {
    try {
      const { data: createData, errors } =
        await customerAccount.mutate<CustomerAddressCreateMutation>(
          CREATE_ADDRESS_MUTATION,
          { variables: { address, defaultAddress } },
        );

      invariant(!errors?.length, errors?.[0]?.message);

      invariant(
        !createData?.customerAddressCreate?.userErrors?.length,
        createData?.customerAddressCreate?.userErrors?.[0]?.message,
      );

      invariant(
        createData?.customerAddressCreate?.customerAddress?.id,
        "Expected customer address to be created",
      );

      return redirect(accountPath(params.locale));
    } catch (error: any) {
      return data(
        { formError: error.message },
        {
          status: 400,
        },
      );
    }
  } else {
    try {
      const { data: updateData, errors } =
        await customerAccount.mutate<CustomerAddressUpdateMutation>(
          UPDATE_ADDRESS_MUTATION,
          {
            variables: {
              address,
              addressId,
              defaultAddress,
            },
          },
        );

      invariant(!errors?.length, errors?.[0]?.message);

      invariant(
        !updateData?.customerAddressUpdate?.userErrors?.length,
        updateData?.customerAddressUpdate?.userErrors?.[0]?.message,
      );

      return redirect(accountPath(params.locale));
    } catch (error: any) {
      return data(
        { formError: error.message },
        {
          status: 400,
        },
      );
    }
  }
};

async function handlePreviewAddressAction(
  request: Request,
  formData: FormData,
  locale?: string,
) {
  const previewState = await readAccountPreviewState(request);
  const addressId = formData.get("addressId");

  if (typeof addressId !== "string") {
    return data(
      { formError: "You must provide an address id." },
      { status: 400 },
    );
  }

  if (request.method === "DELETE") {
    previewState.addresses = previewState.addresses.filter(
      (address) => address.id !== addressId,
    );
    if (previewState.defaultAddressId === addressId) {
      previewState.defaultAddressId = previewState.addresses[0]?.id ?? null;
    }
  } else if (addressId === "add") {
    const newAddressId = `preview-address-${previewState.nextAddressId}`;
    previewState.nextAddressId += 1;
    previewState.addresses.push(previewAddressFromForm(formData, newAddressId));
    if (formData.get("defaultAddress") === "on") {
      previewState.defaultAddressId = newAddressId;
    }
  } else {
    const addressIndex = previewState.addresses.findIndex(
      (address) => address.id === addressId,
    );
    if (addressIndex < 0) {
      return data({ formError: "Address not found." }, { status: 404 });
    }
    previewState.addresses[addressIndex] = previewAddressFromForm(
      formData,
      addressId,
    );
    if (formData.get("defaultAddress") === "on") {
      previewState.defaultAddressId = addressId;
    }
  }

  return redirect(accountPath(locale), {
    headers: {
      "Set-Cookie": await commitAccountPreviewState(previewState),
    },
  });
}

function previewAddressFromForm(
  formData: FormData,
  id: string,
): AccountPreviewAddress {
  const firstName = formValue(formData, "firstName");
  const lastName = formValue(formData, "lastName");
  const company = formValue(formData, "company");
  const address1 = formValue(formData, "address1");
  const address2 = formValue(formData, "address2");
  const city = formValue(formData, "city");
  const zoneCode = formValue(formData, "zoneCode");
  const zip = formValue(formData, "zip");
  const territoryCode = formValue(formData, "territoryCode");
  const phoneNumber = formValue(formData, "phoneNumber");
  const fullName = `${firstName} ${lastName}`.trim();
  const cityLine = [city, zoneCode].filter(Boolean).join(", ");
  const formatted = [
    fullName,
    company,
    address1 !== company ? address1 : "",
    address2,
    cityLine,
    zip,
  ].filter(Boolean);

  return {
    id,
    formatted,
    firstName: firstName || null,
    lastName: lastName || null,
    company: company || null,
    address1: address1 || null,
    address2: address2 || null,
    territoryCode: (territoryCode ||
      "US") as AccountPreviewAddress["territoryCode"],
    zoneCode: zoneCode || null,
    city: city || null,
    zip: zip || null,
    phoneNumber: phoneNumber || null,
  };
}

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export default AccountEditAddressForm;

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/customerAddressUpdate
export const UPDATE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressUpdate(
    $address: CustomerAddressInput!
    $addressId: ID!
    $defaultAddress: Boolean
 ) {
    customerAddressUpdate(
      address: $address
      addressId: $addressId
      defaultAddress: $defaultAddress
    ) {
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/customerAddressDelete
export const DELETE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressDelete(
    $addressId: ID!,
  ) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/customerAddressCreate
export const CREATE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressCreate(
    $address: CustomerAddressInput!
    $defaultAddress: Boolean
  ) {
    customerAddressCreate(
      address: $address
      defaultAddress: $defaultAddress
    ) {
      customerAddress {
        id
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;
