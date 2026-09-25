import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { AccountDetails } from "~/components/customer/account-details";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { useAccountSectionData } from ".";

interface AccountDetailsBlockProps extends Partial<HydrogenComponentProps> {
  heading?: string;
  editText?: string;
}

function AccountDetailsBlock({
  heading: rawI18nHeading = "ACCOUNT",
  editText: rawI18nEditText = "EDIT",
  children: _children,
  ...rest
}: AccountDetailsBlockProps) {
  const translateText = useTranslatedText();
  const heading = translateText(
    rawI18nHeading,
    "themeContent.sectionsAccountDetails.heading",
  );
  const editText = translateText(
    rawI18nEditText,
    "themeContent.sectionsAccountDetails.editText",
  );

  const { customer } = useAccountSectionData();
  return (
    <AccountDetails
      {...rest}
      customer={customer}
      editText={editText}
      heading={heading}
    />
  );
}

export default AccountDetailsBlock;

export const schema = createSchema({
  type: "account-details",
  title: "Account details",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "ACCOUNT",
        },
        {
          type: "text",
          name: "editText",
          label: "Edit link text",
          defaultValue: "EDIT",
        },
      ],
    },
  ],
  presets: { heading: "ACCOUNT", editText: "EDIT" },
});
