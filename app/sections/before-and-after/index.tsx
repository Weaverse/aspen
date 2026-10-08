import {
  type HydrogenComponentSchema,
  useChildInstances,
} from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

import Slider, {
  type BeforeAfterSettings,
  schema as sliderSchema,
} from "./slider";

type BeforeAndAfterProps = SectionProps & BeforeAfterSettings;

const BeforeAndAfter = forwardRef<HTMLElement, BeforeAndAfterProps>(
  (props, ref) => {
    // Read saved slider data for existing documents without rendering a child.
    const legacyData = useChildInstances().find(
      (child) => child.data.type === "before-after-slider",
    )?.data;
    const {
      children: _legacyChildren,
      width = "full",
      gap = 0,
      verticalPadding = "none",
      beforeImage1 = legacyData?.beforeImage1,
      afterImage2 = legacyData?.afterImage2,
      separatorColor = legacyData?.separatorColor,
      showList = legacyData?.showList,
      listColor = legacyData?.listColor,
      separatorWidth = legacyData?.separatorWidth,
      heightMode = legacyData?.heightMode,
      sliderHeightDesktop = legacyData?.sliderHeightDesktop,
      sliderHeightMobile = legacyData?.sliderHeightMobile,
      initialPositionDesktop = legacyData?.initialPositionDesktop,
      initialPositionMobile = legacyData?.initialPositionMobile,
      ...rest
    } = props;
    return (
      <Section
        ref={ref}
        width={width}
        gap={gap}
        verticalPadding={verticalPadding}
        {...rest}
      >
        <Slider
          beforeImage1={beforeImage1}
          afterImage2={afterImage2}
          separatorColor={separatorColor}
          showList={showList}
          listColor={listColor}
          separatorWidth={separatorWidth}
          heightMode={heightMode}
          sliderHeightDesktop={sliderHeightDesktop}
          sliderHeightMobile={sliderHeightMobile}
          initialPositionDesktop={initialPositionDesktop}
          initialPositionMobile={initialPositionMobile}
        />
      </Section>
    );
  },
);

export default BeforeAndAfter;

export let schema: HydrogenComponentSchema = {
  type: "before-and-after",
  title: "Before & after",
  // toolbar: ['general-settings', ['duplicate', 'delete']],
  settings: [
    {
      group: "Section layout",
      inputs: layoutInputs.filter(
        ({ name }) => name !== "divider" && name !== "borderRadius",
      ),
    },
    // Defaults here would mask settings saved on a legacy slider child.
    // New sections get the same defaults from presets; the slider also keeps
    // its runtime defaults when neither parent nor legacy data has a value.
    ...(sliderSchema.settings || []).map((group) => ({
      ...group,
      inputs: group.inputs.map(
        ({ defaultValue: _defaultValue, ...input }) => input,
      ),
    })),
  ],
  presets: {
    ...Object.fromEntries(
      (sliderSchema.settings || []).flatMap((group) =>
        group.inputs
          .filter(
            (input) =>
              input.defaultValue !== undefined && input.defaultValue !== null,
          )
          .map((input) => [input.name, input.defaultValue]),
      ),
    ),
    ...sliderSchema.presets,
    width: "full",
    gap: 0,
    verticalPadding: "none",
  },
};
