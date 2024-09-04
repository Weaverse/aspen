import {
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {clsx} from 'clsx';
import type {CSSProperties} from 'react';
import {forwardRef} from 'react';

import type {Alignment} from '~/lib/type';

type HeadingProps = HydrogenComponentProps & {
  content: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  color?: string;
  alignment?: Alignment;
  className?: string;
};

let alignmentClasses: Record<Alignment, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

let Heading = forwardRef<HTMLHeadingElement, HeadingProps>((props, ref) => {
  let {as: Tag = 'h2', content, color, className, alignment, ...rest} = props;
  let style: CSSProperties = {color};

  return (
    <Tag
      ref={ref}
      {...rest}
      style={style}
      className={clsx(className, alignmentClasses[alignment!])}
    >
      {content}
    </Tag>
  );
});

export default Heading;

export let schema: HydrogenComponentSchema = {
  type: 'image-heading',
  title: 'Heading',
  inspector: [
    {
      group: 'Heading',
      inputs: [
        // {
        //   type: 'select',
        //   name: 'as',
        //   label: 'Tag name',
        //   configs: {
        //     options: [
        //       {value: 'h1', label: 'Heading 1'},
        //       {value: 'h2', label: 'Heading 2'},
        //       {value: 'h3', label: 'Heading 3'},
        //       {value: 'h4', label: 'Heading 4'},
        //       {value: 'h5', label: 'Heading 5'},
        //       {value: 'h6', label: 'Heading 6'},
        //     ],
        //   },
        //   defaultValue: 'h2',
        // },
        {
          type: 'text',
          name: 'content',
          label: 'Content',
          defaultValue: 'Section heading',
          placeholder: 'Section heading',
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
        //       {value: 'default', label: 'Default'},
        //       {value: 'lead', label: 'Lead'},
        //       {value: 'heading', label: 'Heading'},
        //       {value: 'display', label: 'Display'},
        //       {value: 'jumbo', label: 'Jumbo'},
        //       {value: 'scale', label: 'Auto scale'},
        //     ],
        //   },
        //   defaultValue: 'default',
        //   helpText: 'Text size is responsive automatically.',
        // },
        // {
        //   type: 'range',
        //   name: 'minSize',
        //   label: 'Minimum scale size',
        //   configs: {
        //     min: 12,
        //     max: 32,
        //     step: 1,
        //     unit: 'px',
        //   },
        //   defaultValue: 16,
        //   condition: 'size.eq.scale',
        // },
        // {
        //   type: 'range',
        //   name: 'maxSize',
        //   label: 'Maximum scale size',
        //   configs: {
        //     min: 64,
        //     max: 96,
        //     step: 1,
        //     unit: 'px',
        //   },
        //   defaultValue: 72,
        //   condition: 'size.eq.scale',
        //   helpText:
        //     'See how scale text works <a href="https://css-tricks.com/snippets/css/fluid-typography/" target="_blank" rel="noreferrer">here</a>.',
        // },
        // {
        //   type: 'select',
        //   name: 'weight',
        //   label: 'Weight',
        //   configs: {
        //     options: [
        //       {value: 'medium', label: 'Medium'},
        //       {value: 'semibold', label: 'Semibold'},
        //       {value: 'bold', label: 'Bold'},
        //       {value: 'extrabold', label: 'Extrabold'},
        //     ],
        //   },
        //   defaultValue: 'bold',
        // },
        // {
        //   type: 'select',
        //   name: 'tracking',
        //   label: 'Letter spacing',
        //   configs: {
        //     options: [
        //       {value: 'tight', label: 'Tight'},
        //       {value: 'inherit', label: 'Inherit'},
        //       {value: 'wide', label: 'Wide'},
        //     ],
        //   },
        //   defaultValue: 'inherit',
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
