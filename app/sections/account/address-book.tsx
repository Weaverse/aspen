import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { AccountAddressBook } from "~/components/customer/address-book";
import { useAccountSectionData } from ".";

interface AccountAddressBookBlockProps extends Partial<HydrogenComponentProps> {
  heading?: string;
  addAddressText?: string;
  editText?: string;
  removeText?: string;
  defaultText?: string;
}

function AccountAddressBookBlock({
  heading = "ADDRESS BOOK",
  addAddressText = "ADD NEW ADDRESS",
  editText = "EDIT",
  removeText = "REMOVE",
  defaultText = "DEFAULT",
  children: _children,
  ...rest
}: AccountAddressBookBlockProps) {
  const { addresses, customer } = useAccountSectionData();
  return (
    <AccountAddressBook
      {...rest}
      addAddressText={addAddressText}
      addresses={addresses}
      customer={customer}
      defaultText={defaultText}
      editText={editText}
      heading={heading}
      removeText={removeText}
    />
  );
}

export default AccountAddressBookBlock;

export const schema = createSchema({
  type: "account-address-book",
  title: "Address book",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "ADDRESS BOOK",
        },
        {
          type: "text",
          name: "addAddressText",
          label: "Add address text",
          defaultValue: "ADD NEW ADDRESS",
        },
        {
          type: "text",
          name: "defaultText",
          label: "Default badge text",
          defaultValue: "DEFAULT",
        },
        {
          type: "text",
          name: "editText",
          label: "Edit text",
          defaultValue: "EDIT",
        },
        {
          type: "text",
          name: "removeText",
          label: "Remove text",
          defaultValue: "REMOVE",
        },
      ],
    },
  ],
  presets: {
    heading: "ADDRESS BOOK",
    addAddressText: "ADD NEW ADDRESS",
    defaultText: "DEFAULT",
    editText: "EDIT",
    removeText: "REMOVE",
  },
});
