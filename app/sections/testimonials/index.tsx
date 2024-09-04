import {Link} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import type {
  ComponentLoaderArgs,
  HydrogenComponentProps,
  HydrogenComponentSchema,
  WeaverseImage,
} from '@weaverse/hydrogen';
import type {CSSProperties} from 'react';
import {forwardRef} from 'react';

type TestimonialsData = {
  paddingTop: number;
  paddingBottom: number;
  maxWidth: number;
  buttonColor: string;
  button: string;
  enableFullWidth: boolean;
  backgroundColor: string;

  // More type definitions...
};

type TestimonialsProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  TestimonialsData;

let Testimonials = forwardRef<HTMLElement, TestimonialsProps>((props, ref) => {
  let {
    paddingTop,
    paddingBottom,
    children,
    buttonColor,
    button,
    maxWidth,
    enableFullWidth,
    backgroundColor,
    ...rest
  } = props;
  // More component logic...
  let styleSection: CSSProperties = {
    paddingTop,
    paddingBottom,
    maxWidth,
    backgroundColor,
    margin: '0 auto',
    width: enableFullWidth ? '100%' : 'auto',
  } as CSSProperties;
  return <section ref={ref} {...rest} style={styleSection}></section>;
});

export let loader = async (args: ComponentLoaderArgs<TestimonialsData>) => {
  // Data fetching logic, the code will be run on the server-side ...
};

export let schema: HydrogenComponentSchema = {
  type: 'testimonials',
  title: 'Testimonials',
  // More schema definitions...
  inspector: [
    {
      group: 'Testimonials',
      inputs: [
        {
          type: 'range',
          label: 'Padding Top',
          name: 'paddingTop',
          defaultValue: 40,
          configs: {
            min: 0,
            max: 300,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'range',
          label: 'Padding Bottom',
          name: 'paddingBottom',
          defaultValue: 40,
          configs: {
            min: 0,
            max: 300,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'range',
          label: 'Max width',
          name: 'maxWidth',
          defaultValue: 1200,
          configs: {
            min: 0,
            max: 1400,
            step: 10,
            unit: 'px',
          },
        },
        {
          type: 'switch',
          label: 'Enable full width',
          name: 'enableFullWidth',
          defaultValue: true,
        },
        {
          type: 'color',
          label: 'Background color',
          name: 'backgroundColor',
          defaultValue: '#FFFFFF',
        },
      ],
    },
  ],
};

export default Testimonials;
