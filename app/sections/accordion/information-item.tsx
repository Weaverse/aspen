import {
  createSchema,
  type WeaverseComponentProps,
} from "@weaverse/hydrogen/react-router";
import { forwardRef } from "react";

interface InformationItemProps extends WeaverseComponentProps {
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
        content: "Add your support email",
        alignment: "left",
        width: "full",
      },
    ],
  },
});
