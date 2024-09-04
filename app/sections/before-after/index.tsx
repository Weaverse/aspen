import type {
  ComponentLoaderArgs,
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {forwardRef} from 'react';
import type {CSSProperties} from 'react';
import clsx from 'clsx';
type BeforeAfterData = {
  bgColor: string;
  sectionHeight: number;
  topPadding: number;
  bottomPadding: number;
  // More type definitions...
};

type BeforeAfterProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  BeforeAfterData;

let BeforeAfter = forwardRef<HTMLElement, BeforeAfterProps>((props, ref) => {
  let {bgColor, sectionHeight, topPadding, bottomPadding, children, ...rest} =
    props;
  // More component logic...
  let sectionStyle: CSSProperties = {
    height: `${sectionHeight}px`,
    backgroundColor: bgColor,
    paddingTop: `${topPadding}px`,
    paddingBottom: `${bottomPadding}px`,
  } as CSSProperties;

  return (
    <section style={sectionStyle} ref={ref} {...rest}>
      {children}
    </section>
  );
});

export let loader = async (args: ComponentLoaderArgs<BeforeAfterData>) => {
  // Data fetching logic, the code will be run on the server-side ...
};

export let schema: HydrogenComponentSchema = {
  type: 'before-after-type',
  title: 'Before After Slider',
  // More schema definitions...
  childTypes: ['heading', 'before-after-slider-type'],
  inspector: [
    {
      group: 'General',
      inputs: [
        {
          type: 'color',
          label: 'Background color',
          name: 'bgColor',
          defaultValue: '#F08D27',
        },
        {
          type: 'range',
          label: 'Section Height',
          name: 'sectionHeight',
          defaultValue: 400,
          configs: {
            min: 200,
            max: 800,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'range',
          label: 'Top padding',
          name: 'topPadding',
          defaultValue: 10,
          configs: {
            min: 10,
            max: 200,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'range',
          label: 'Bottom padding',
          name: 'bottomPadding',
          defaultValue: 10,
          configs: {
            min: 10,
            max: 200,
            step: 1,
            unit: 'px',
          },
        },
      ],
    },
  ],
};

export default BeforeAfter;
