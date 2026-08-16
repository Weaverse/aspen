import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { AccountOrderHistory } from "~/components/customer/orders";
import { useAccountSectionData } from ".";

interface AccountOrdersProps extends Partial<HydrogenComponentProps> {
  heading?: string;
  maxOrders?: number;
}

function AccountOrders({
  heading = "ORDERS",
  maxOrders = 2,
  children: _children,
  ...rest
}: AccountOrdersProps) {
  const { orders } = useAccountSectionData();
  return (
    <AccountOrderHistory
      {...rest}
      heading={heading}
      orders={orders.slice(0, maxOrders)}
    />
  );
}

export default AccountOrders;

export const schema = createSchema({
  type: "account-orders",
  title: "Orders",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "ORDERS",
        },
        {
          type: "range",
          name: "maxOrders",
          label: "Maximum orders",
          defaultValue: 2,
          configs: { min: 1, max: 12, step: 1 },
        },
      ],
    },
  ],
  presets: { heading: "ORDERS", maxOrders: 2 },
});
