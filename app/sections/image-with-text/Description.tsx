import {
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {clsx} from 'clsx';
import {forwardRef} from 'react';

type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';
let sizes: Record<Size, string> = {
  XS: 'text-xs',
  S: 'text-sm',
  M: 'text-base',
  L: 'text-lg',
  XL: 'text-xl',
};
type DescriptionProps = HydrogenComponentProps & {
  content: string;
  color?: string;
  paragraphSize: Size;
};

let Description = forwardRef<
  HTMLParagraphElement | HTMLDivElement,
  DescriptionProps
>((props, ref) => {
  let {content, color, paragraphSize, ...rest} = props;
  return (
    <p
      className={clsx(sizes[paragraphSize!])}
      ref={ref}
      style={{color}}
      dangerouslySetInnerHTML={{__html: content}}
    />
  );
});

export default Description;

export let schema: HydrogenComponentSchema = {
  type: 'image-with-text-description',
  title: 'Paragraph',
  inspector: [
    {
      group: 'Paragraph',
      inputs: [
        {
          type: 'textarea',
          label: 'Text',
          name: 'content',
          defaultValue:
            'The shipping was fast, and the packaging was eco-friendly. I love shopping here!',
          placeholder: 'Share customer shopping experience...',
        },
        {
          type: 'toggle-group',
          name: 'paragraphSize',
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
          defaultValue: 'M',
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
