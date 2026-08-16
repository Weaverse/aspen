import { flattenConnection } from "@shopify/hydrogen";
import type { CustomerAddress } from "@shopify/hydrogen/customer-account-api-types";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type {
  CustomerDetailsFragment,
  OrderCardFragment,
} from "customer-account-api.generated";
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  type Ref,
  useContext,
} from "react";
import { useLoaderData } from "react-router";
import { cn } from "~/utils/cn";

interface AccountSectionData {
  customer: CustomerDetailsFragment;
  orders: OrderCardFragment[];
  addresses: CustomerAddress[];
}

const AccountSectionContext = createContext<AccountSectionData | null>(null);

export function useAccountSectionData() {
  const value = useContext(AccountSectionContext);
  if (!value) {
    throw new Error("Account child blocks must be placed inside Account.");
  }
  return value;
}

interface AccountSectionProps
  extends Partial<Omit<HydrogenComponentProps, "children">> {
  customer?: CustomerDetailsFragment;
  heading?: string;
  backgroundColor?: string;
  children?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
}

function AccountSection({
  customer: customerProp,
  heading = "ACCOUNT",
  backgroundColor = "#EDEDED",
  children,
  className,
  ref,
  ...rest
}: AccountSectionProps) {
  const routeData = useLoaderData() as {
    customer?: CustomerDetailsFragment;
  };
  const customer = customerProp || routeData?.customer;

  if (!customer) {
    return null;
  }

  const contextValue: AccountSectionData = {
    customer,
    orders: flattenConnection(customer.orders),
    addresses: flattenConnection(customer.addresses),
  };
  const style = { "--account-background": backgroundColor } as CSSProperties;

  return (
    <AccountSectionContext.Provider value={contextValue}>
      <section
        ref={ref}
        {...rest}
        style={style}
        className={cn("bg-(--account-background)", className)}
      >
        <div className="mx-auto max-w-[1440px] px-4 pt-6 pb-10 md:px-8 md:pt-10 md:pb-16 lg:px-10 lg:pt-16 lg:pb-20">
          {heading ? (
            <h1 className="font-heading font-normal text-[36px] text-[#343231] uppercase leading-10 tracking-[-0.025em] md:text-[44px] md:leading-[1.1]">
              {heading}
            </h1>
          ) : null}
          <div className="mt-8 flex flex-col gap-[29px] md:mt-10 md:gap-10">
            {children}
          </div>
        </div>
      </section>
    </AccountSectionContext.Provider>
  );
}

export default AccountSection;

export const schema = createSchema({
  type: "account",
  title: "Account",
  limit: 1,
  enabled: ({ page }) => page.type === "CUSTOM",
  childTypes: ["account-orders", "account-details", "account-address-book"],
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
      ],
    },
    {
      group: "Colors",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background",
          defaultValue: "#EDEDED",
        },
      ],
    },
  ],
  presets: {
    heading: "ACCOUNT",
    backgroundColor: "#EDEDED",
    children: [
      { type: "account-orders" },
      { type: "account-details" },
      { type: "account-address-book" },
    ],
  },
});
