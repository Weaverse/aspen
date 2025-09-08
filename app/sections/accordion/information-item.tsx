import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";

interface InformationItemProps extends HydrogenComponentProps {
  // allowMultiple: boolean;
}

const InformationItem = forwardRef<HTMLDivElement, InformationItemProps>(
  (props, ref) => {
    let { children, ...rest } = props;

    return (
      <div ref={ref} {...rest}>
        {children}
      </div>
    );
  },
);

export default InformationItem;

export const schema = createSchema({
  type: "information--item",
  title: "Information Item",
  inspector: [
    {
      group: "Content settings",
      inputs: [
        // {
        //   type: "switch",
        //   name: "allowMultiple",
        //   label: "Allow multiple open",
        //   defaultValue: true,
        // },
      ],
    },
  ],
  childTypes: ["paragraph"],
  presets: {
    children: [
      {
        type: "paragraph",
        content: "Email",
        alignment: "left",
        width: "full",
      },
      {
        type: "paragraph",
        content: "support@archercommerce.com",
        alignment: "left",
        width: "full",
      },
    ],
  },
});
