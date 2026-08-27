import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import { cn } from "~/utils/cn";

const CollectionList = forwardRef<HTMLElement, SectionProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <Section
      ref={ref}
      {...rest}
      className={cn("overflow-x-clip", className)}
      overflow="unset"
    >
      {children}
    </Section>
  );
});

export default CollectionList;

export const schema = createSchema({
  type: "collection-list",
  title: "Collection list",
  limit: 1,
  childTypes: ["subheading", "heading", "paragraph", "collections-items"],
  enabledOn: {
    pages: ["COLLECTION_LIST"],
  },
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((input) => input.name !== "borderRadius"),
    },
  ],
  presets: {
    gap: 60,
    children: [
      {
        type: "heading",
        content: "Collections",
      },
      {
        type: "collections-items",
        prevButtonText: "↑ Load previous",
        nextButtonText: "Load more ↓",
        layout: "grid",
        gap: 16,
        desktopGap: 20,
        collectionNameColor: "#FEF4EB",
        collectionBackgroundColor: "#7F7866",
      },
    ],
  },
});
