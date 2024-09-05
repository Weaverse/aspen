import type {
  ComponentLoaderArgs,
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {CSSProperties, forwardRef} from 'react';
import clsx from 'clsx';
type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';
type ScrollingTextData = {
  bgColor: string;
  announceHeight: number;
  enableAnimation: boolean;
  content: string;
  size: Size;
  brColor: string;
  textColor: string;
  padding: number;
  margin: number;
  speed: number;
  visibleOnMobile: boolean;
};
let sizes: Record<Size, string> = {
  XS: 'text-base',
  S: 'text-lg',
  M: 'text-xl',
  L: 'text-2xl',
  XL: 'text-3xl',
};
type ScrollingTextProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  ScrollingTextData;

let ScrollingText = forwardRef<HTMLElement, ScrollingTextProps>(
  (props, ref) => {
    let {
      bgColor,
      size,
      announceHeight,
      enableAnimation,
      brColor,
      content,
      textColor,
      padding,
      margin,
      speed,
      visibleOnMobile,
      ...rest
    } = props;

    let sectionStyle: CSSProperties = {
      backgroundColor: bgColor,
      borderColor: brColor,
      paddingTop: `${padding}px`,
      paddingBottom: `${padding}px`,
      marginTop: `${margin}px`,
      marginBottom: `${margin}px`,
    } as CSSProperties;

    return (
      <section style={sectionStyle} ref={ref} {...rest}>
        <style>{`
          @keyframes scroll {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          .animate-scroll {
            animation: scroll ${speed}s linear infinite;
          }
        `}</style>
        <div
          className={clsx(
            'py-2 px-4 overflow-hidden relative border flex items-center',
            visibleOnMobile ? 'md:block' : 'hidden',
          )}
        >
          <div
            className={clsx(
              'whitespace-nowrap inline-block animate-scroll',
              sizes[size!],
            )}
          >
            <span className="inline-block pr-8" style={{color: textColor}}>
              {content}
            </span>
            <span className="inline-block pr-8" style={{color: textColor}}>
              {content}
            </span>
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
  inspector: [
    {
      group: 'General',
      inputs: [
        {
          type: 'textarea',
          label: 'Text',
          name: 'content',
          defaultValue:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        },
        {
          type: 'toggle-group',
          name: 'size',
          label: 'Text size',
          configs: {
            options: [
              {value: 'S', label: 'S'},
              {value: 'M', label: 'M'},
              {value: 'L', label: 'L'},
            ],
          },
          defaultValue: 'S',
        },
        {
          type: 'color',
          label: 'Text color',
          name: 'textColor',
          defaultValue: '#F08D27',
        },
        {
          type: 'color',
          label: 'Border color',
          name: 'brColor',
          defaultValue: '#67513a',
        },
        {
          type: 'color',
          label: 'Background color',
          name: 'bgColor',
          defaultValue: '#c4beb8',
        },
        {
          type: 'range',
          label: 'Vertical padding',
          name: 'padding',
          defaultValue: 10,
          configs: {
            min: 5,
            max: 50,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'range',
          label: 'Vertical margin',
          name: 'margin',
          defaultValue: 10,
          configs: {
            min: 0,
            max: 50,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'range',
          label: 'Speed',
          name: 'speed',
          defaultValue: 10,
          configs: {
            min: 0,
            max: 100,
            step: 1,
            unit: 's',
          },
        },
        {
          type: 'switch',
          label: 'Visible on mobile',
          name: 'visibleOnMobile',
          defaultValue: true,
        },
      ],
    },
  ],
};

export default ScrollingText;
