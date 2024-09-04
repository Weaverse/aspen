import {
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {clsx} from 'clsx';
import {forwardRef} from 'react';

import type {Alignment} from '~/lib/type';

type DescriptionProps = HydrogenComponentProps & {
  content: string;
  as?: 'p' | 'div';
  color?: string;
  width?: Width;
  size: Size;
  alignment?: Alignment;
  className?: string;
};

type Width = 'full' | 'narrow';

let widthClasses: Record<Width, string> = {
  full: 'w-full mx-auto',
  narrow: 'w-full md:w-1/2 lg:w-3/4 max-w-4xl mx-auto',
};
type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';
let sizes: Record<Size, string> = {
  XS: 'text-base',
  S: 'text-lg',
  M: 'text-xl',
  L: 'text-2xl',
  XL: 'text-3xl',
};
let alignmentClasses: Record<Alignment, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

let Description = forwardRef<
  HTMLParagraphElement | HTMLDivElement,
  DescriptionProps
>((props, ref) => {
  let {
    as: Tag = 'p',
    width,
    content,
    size,
    color,
    alignment,
    className,
    ...rest
  } = props;
  return (
    <Tag
      ref={ref}
      {...rest}
      style={{color}}
      className={clsx(
        widthClasses[width!],
        sizes[size!],
        alignmentClasses[alignment!],
        className,
      )}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{__html: content}}
    />
  );
});

Description.defaultProps = {
  as: 'p',
  width: 'narrow',
  content:
    "Pair large text with an image or full-width video to showcase your brand's lifestyle to describe and showcase an important detail of your products that you can tag on your image.",
  alignment: 'center',
};

export default Description;

export let schema: HydrogenComponentSchema = {
  type: 'image-description',
  title: 'Paragraph',
  inspector: [
    {
      group: 'Paragraph',
      inputs: [
        {
          type: 'richtext',
          name: 'content',
          label: 'Content',
          defaultValue:
            "Pair large text with an image or full-width video to showcase your brand's lifestyle to describe and showcase an important detail of your products that you can tag on your image.",
          placeholder:
            "Pair large text with an image or full-width video to showcase your brand's lifestyle to describe and showcase an important detail of your products that you can tag on your image.",
        },
        {
          type: 'toggle-group',
          name: 'size',
          label: 'Text size',
          configs: {
            options: [
              {value: 'XS', label: 'XS'},
              {value: 'S', label: 'S'},
              {value: 'M', label: 'M'},
              {value: 'L', label: 'L'},
              {value: 'XL', label: 'XL'},
            ],
          },
          defaultValue: 'S',
        },
        {
          type: 'color',
          name: 'color',
          label: 'Text color',
        },

        {
          type: 'toggle-group',
          name: 'alignment',
          label: 'Alignment',
          configs: {
            options: [
              {value: 'left', label: 'Left', icon: 'align-start-vertical'},
              {value: 'center', label: 'Center', icon: 'align-center-vertical'},
              {value: 'right', label: 'Right', icon: 'align-end-vertical'},
            ],
          },
          defaultValue: 'center',
        },
      ],
    },
  ],
  toolbar: ['general-settings', ['duplicate', 'delete']],
};
