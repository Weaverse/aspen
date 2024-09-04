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
  subHeadingSize?: Size;
  weight?: Weight;
  alignment: Alignment;
  className?: string;
};

let sizes: Record<Size, string> = {
  XS: 'text-xs',
  S: 'text-sm',
  M: 'text-base',
  L: 'text-lg',
  XL: 'text-xl',
};

let SubHeading = forwardRef<
  HTMLHeadingElement | HTMLParagraphElement | HTMLDivElement,
  SubHeadingProps
>((props, ref) => {
  let {content, color, subHeadingSize, ...rest} = props;
  return (
    <p
      ref={ref}
      {...rest}
      style={{color}}
      className={clsx(sizes[subHeadingSize!])}
    >
      {content}
    </p>
  );
});

export default SubHeading;

export let schema: HydrogenComponentSchema = {
  type: 'image-with-text-subheading',
  title: 'Subheading',
  inspector: [
    {
      group: 'Subheading',
      inputs: [
        {
          type: 'text',
          name: 'content',
          label: 'Subheading',
          defaultValue: 'Subheading',
          placeholder: 'Section subheading',
        },
        {
          type: 'toggle-group',
          name: 'subHeadingSize',
          label: 'Subheading size',
          configs: {
            options: [
              {value: 'XS', label: 'XS'},
              {value: 'S', label: 'S'},
              {value: 'M', label: 'M'},
              {value: 'L', label: 'L'},
              {value: 'XL', label: 'XL'},
            ],
          },
          defaultValue: 'XS',
        },
        {
          type: 'color',
          name: 'color',
          label: 'Text color',
        },
      ],
    },
  ],
  toolbar: ['general-settings', ['duplicate', 'delete']],
};
