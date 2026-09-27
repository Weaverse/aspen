import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { AccountAddressBook } from "~/components/customer/address-book";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { useAccountSectionData } from ".";

interface AccountAddressBookBlockProps extends Partial<HydrogenComponentProps> {
  heading?: string;
  addAddressText?: string;
  editText?: string;
  removeText?: string;
  defaultText?: string;
}

function AccountAddressBookBlock({
  heading: rawI18nHeading = "ADDRESS BOOK",
  addAddressText: rawI18nAddAddressText = "ADD NEW ADDRESS",
  editText: rawI18nEditText = "EDIT",
  removeText: rawI18nRemoveText = "REMOVE",
  defaultText: rawI18nDefaultText = "DEFAULT",
  children: _children,
  ...rest
}: AccountAddressBookBlockProps) {
  const translateText = useTranslatedText();
  const heading = translateText(
    rawI18nHeading,
    "themeContent.sectionsAccountAddressBook.heading",
  );
  const addAddressText = translateText(
    rawI18nAddAddressText,
    "themeContent.sectionsAccountAddressBook.addAddressText",
  );
  const editText = translateText(
    rawI18nEditText,
    "themeContent.sectionsAccountAddressBook.editText",
  );
  const removeText = translateText(
    rawI18nRemoveText,
    "themeContent.sectionsAccountAddressBook.removeText",
  );
  const defaultText = translateText(
    rawI18nDefaultText,
    "themeContent.sectionsAccountAddressBook.defaultText",
  );

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
