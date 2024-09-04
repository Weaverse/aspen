import {
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {clsx} from 'clsx';
import {forwardRef} from 'react';

import type {Alignment} from '~/lib/type';

type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';
type Weight = 'normal' | 'medium';
type SubHeadingProps = HydrogenComponentProps & {
  content: string;
  as?: 'h4' | 'h5' | 'h6' | 'div' | 'p';
  color?: string;
  size?: Size;
  weight?: Weight;
  alignment: Alignment;
  className?: string;
};

let sizes: Record<Size, string> = {
  XS: 'text-base',
  S: 'text-lg',
  M: 'text-xl',
  L: 'text-2xl',
  XL: 'text-3xl',
};

let weightClasses: Record<Weight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
};

let alignmentClasses: Record<Alignment, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

let SubHeading = forwardRef<
  HTMLHeadingElement | HTMLParagraphElement | HTMLDivElement,
  SubHeadingProps
>((props, ref) => {
  let {
    as: Tag = 'p',
    content,
    color,
    size,
    weight,
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
        sizes[size!],
        weightClasses[weight!],
        alignmentClasses[alignment!],
        className,
      )}
    >
      {content}
    </Tag>
  );
});

export default SubHeading;

export let schema: HydrogenComponentSchema = {
  type: 'image-subheading',
  title: 'Subheading',
  inspector: [
    {
      group: 'Subheading',
      inputs: [
        {
          type: 'text',
          name: 'content',
          label: 'Subheading',
          defaultValue: 'Heading for Image Section',
          placeholder: 'Enter your subheading',
        },
        {
          type: 'color',
          name: 'color',
          label: 'Text color',
        },
        // {
        //   type: 'select',
        //   name: 'size',
        //   label: 'Text size',
        //   configs: {
        //     options: [
        //       {value: 'base', label: 'Base'},
        //       {value: 'large', label: 'Large'},
        //     ],
        //   },
        //   defaultValue: 'base',
        // },
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
        // {
        //   type: 'select',
        //   name: 'weight',
        //   label: 'Weight',
        //   configs: {
        //     options: [
        //       {value: 'normal', label: 'Normal'},
        //       {value: 'medium', label: 'Medium'},
        //     ],
        //   },
        //   defaultValue: 'normal',
        // },
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
