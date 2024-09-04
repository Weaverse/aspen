import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import type {CSSProperties} from 'react';
import {forwardRef} from 'react';
import {clsx} from 'clsx';

type AlignImage = 'left' | 'right';
interface ImageWithTextProps extends HydrogenComponentProps {
  sectionHeight: number;
  backgroundColor: string;
  imagePosition?: AlignImage;
}

let AlignImageClasses: Record<AlignImage, string> = {
  left: 'flex-row-reverse',
  right: 'flex-row',
};

let ImageWithText = forwardRef<HTMLElement, ImageWithTextProps>(
  (props, ref) => {
    let {imagePosition, sectionHeight, backgroundColor, children, ...rest} =
      props;
    let styleSection: CSSProperties = {
      height: `${sectionHeight}px`,
      backgroundColor,
    } as CSSProperties;

    return (
      <section
        ref={ref}
        {...rest}
        style={styleSection}
        className="mx-auto sm-max:h-auto sm-max:overflow-hidden"
      >
        <div className="h-full w-full">
          <div
            className={clsx(
              'flex justify-center items-center h-full w-full sm-max:flex-col',
              AlignImageClasses[imagePosition!],
            )}
          >
            {children}
          </div>
        </div>
      </section>
    );
  },
);

export default ImageWithText;

export let schema: HydrogenComponentSchema = {
  type: 'image-with-text',
  title: 'Image with text',
  toolbar: ['general-settings', ['duplicate', 'delete']],
  inspector: [
    {
      group: 'Image with text',
      inputs: [
        {
          type: 'toggle-group',
          label: 'Image position',
          name: 'imagePosition',
          configs: {
            options: [
              {label: 'Left', value: 'left'},
              {label: 'Right', value: 'right'},
            ],
          },
          defaultValue: 'left',
        },
        {
          type: 'range',
          label: 'Section height',
          name: 'sectionHeight',
          defaultValue: 600,
          configs: {
            min: 5,
            max: 1000,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'color',
          name: 'backgroundColor',
          label: 'Background color',
          defaultValue: '#f4f4f4',
        },
      ],
    },
  ],
  childTypes: ['image-with-text--content', 'image-with-text--image'],
  presets: {
    children: [
      {
        type: 'image-with-text--content',
      },
      {
        type: 'image-with-text--image',
      },
    ],
  },
};
