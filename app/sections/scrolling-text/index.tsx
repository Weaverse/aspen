import type {
  ComponentLoaderArgs,
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {forwardRef} from 'react';
import clsx from 'clsx';
type ScrollingTextData = {
  bgColor: string;
  announceHeight: number;
  enableAnimation: boolean;
  // More type definitions...
};

type ScrollingTextProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  ScrollingTextData;

let ScrollingText = forwardRef<HTMLElement, ScrollingTextProps>(
  (props, ref) => {
    let {bgColor, announceHeight, enableAnimation, children, ...rest} = props;
    // More component logic...

    return (
      <section ref={ref} {...rest}>
        <div
          style={{backgroundColor: bgColor, height: announceHeight}}
          className="py-2 px-4 overflow-x-hidden relative flex justify-stretch items-center"
        >
          <div
            className={clsx(
              'flex justify-around w-full',
              enableAnimation ? ' animate-marquee ' : '',
            )}
          >
            {children?.map((child, index) => <div key={index}>{child}</div>)}
          </div>
        </div>
      </section>
    );
  },
);

export let loader = async (args: ComponentLoaderArgs<ScrollingTextData>) => {
  // Data fetching logic, the code will be run on the server-side ...
};

export let schema: HydrogenComponentSchema = {
  type: 'scrolling-text-type',
  title: 'Scrolling Text',
  // More schema definitions...
  childTypes: ['announce-bar-item-type'],
  inspector: [
    {
      group: 'General',
      inputs: [
        {
          type: 'range',
          label: 'Height',
          name: 'announceHeight',
          defaultValue: 40,
          configs: {
            min: 40,
            max: 300,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'color',
          label: 'Background color',
          name: 'bgColor',
          defaultValue: '#F08D27',
        },
        {
          type: 'switch',
          label: 'Enable Animation',
          name: 'enableAnimation',
          defaultValue: false,
        },
      ],
    },
  ],
};

export default ScrollingText;
