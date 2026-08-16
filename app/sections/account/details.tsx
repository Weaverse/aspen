import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { AccountDetails } from "~/components/customer/account-details";
import { useAccountSectionData } from ".";

interface AccountDetailsBlockProps extends Partial<HydrogenComponentProps> {
  heading?: string;
  editText?: string;
}

function AccountDetailsBlock({
  heading = "ACCOUNT",
  editText = "EDIT",
  children: _children,
  ...rest
}: AccountDetailsBlockProps) {
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
