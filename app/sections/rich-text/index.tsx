import type {
  ComponentLoaderArgs,
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import type {CSSProperties} from 'react';
import {forwardRef} from 'react';
import clsx from 'clsx';
type RichTextData = {
  backgroundColor: string;
  textColor: string;
  heading: string;
  contentAlignment: string;
  text: string;
  sectionHeight: string;
  buttonLabel: string;
  buttonLink: string;
  openNewTab: boolean;
  buttonStyle: string;
  paddingTop: number;
  paddingBottom: number;
  // More type definitions...
};

type RichTextProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  RichTextData;

let RichText = forwardRef<HTMLElement, RichTextProps>((props, ref) => {
  let {
    backgroundColor,
    textColor,
    heading,
    contentAlignment,
    text,
    sectionHeight,
    buttonLabel,
    buttonLink,
    openNewTab,
    buttonStyle,
    paddingTop,
    paddingBottom,
    children,
    ...rest
  } = props;
  // More component logic...
  let styleSection: CSSProperties = {
    paddingTop,
    paddingBottom,
    backgroundColor,
    color: textColor,
    height: sectionHeight,
    alignItems: contentAlignment,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: contentAlignment,
  } as CSSProperties;

  let textAlign;

  switch (contentAlignment) {
    case 'flex-start':
      textAlign = 'text-left';
      break;
    case 'center':
      textAlign = 'text-center';
      break;
    case 'flex-end':
      textAlign = 'text-right';
      break;
    default:
      textAlign = 'text-left';
  }

  return (
    <section ref={ref} {...rest} style={styleSection}>
      <h1 className="text-3xl font-bold mb-4">{heading}</h1>
      <div className=" block mb-6">
        <p className={`text-lg ${textAlign}`}>{text}</p>
      </div>
      <a
        href={buttonLink}
        target={openNewTab ? '_blank' : '_self'}
        rel={openNewTab ? 'noopener noreferrer' : undefined}
        className={clsx(
          'flex cursor-pointer py-2 px-4 rounded sm-max:px-3',
          buttonStyle,
        )}
      >
        {buttonLabel}
      </a>
    </section>
  );
});

export let loader = async (args: ComponentLoaderArgs<RichTextData>) => {
  // Data fetching logic, the code will be run on the server-side ...
};

export let schema: HydrogenComponentSchema = {
  type: 'rich-text',
  title: 'Rich Text',
  // More schema definitions...
  inspector: [
    {
      group: 'Rich Text',
      inputs: [
        {
          type: 'color',
          name: 'backgroundColor',
          label: 'Background color',
          defaultValue: '#ffffff',
        },
        {
          type: 'color',
          name: 'textColor',
          label: 'Text color',
          defaultValue: '#000000',
        },
        {
          type: 'text',
          label: 'Heading',
          name: 'heading',
          defaultValue: 'Rich Text',
          placeholder: 'Enter section heading',
        },
        {
          type: 'toggle-group',
          label: 'Content alignment',
          name: 'contentAlignment',
          configs: {
            options: [
              {label: 'Left', value: 'flex-start'},
              {label: 'Center', value: 'center'},
              {label: 'Right', value: 'flex-end'},
            ],
          },
          defaultValue: 'center',
        },
        {
          type: 'textarea',
          label: 'Text',
          name: 'text',
          defaultValue:
            'Pair large text with an image to tell a story, explain a detail about your product.',
          placeholder: 'Enter your text here...',
        },
        {
          type: 'range',
          label: 'Section Height',
          name: 'sectionHeight',
          defaultValue: 200,
          configs: {
            min: 0,
            max: 800,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'text',
          label: 'Button label',
          name: 'buttonLabel',
          defaultValue: 'Button',
          placeholder: 'Enter the button text!',
        },
        {
          type: 'url',
          label: 'Button link',
          name: 'buttonLink',
          defaultValue: 'https://',
        },

        {
          type: 'switch',
          label: 'Open in new tab',
          name: 'openNewTab',
          defaultValue: true,
        },
        {
          type: 'toggle-group',
          label: 'Button style',
          name: 'buttonStyle',
          configs: {
            options: [
              {
                label: '1',
                value:
                  'transition hover:bg-white border-2 border-solid hover:border-gray-900 hover:text-black bg-black text-white',
              },
              {
                label: '2',
                value:
                  'transition bg-white border-2 border-solid border-gray-900 text-black hover:bg-black hover:text-white',
              },
              {
                label: '3',
                value:
                  'transition hover:bg-white border-2 border-solid border-white hover:text-black bg-gray-200 text-white',
              },
            ],
          },
          defaultValue:
            'transition hover:bg-white border-2 border-solid hover:border-gray-900 hover:text-black bg-black text-white',
        },
        {
          type: 'range',
          label: 'Padding Top',
          name: 'paddingTop',
          defaultValue: 64,
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
          defaultValue: 64,
          configs: {
            min: 0,
            max: 800,
            step: 1,
            unit: 'px',
          },
        },
      ],
    },
  ],
};

export default RichText;
