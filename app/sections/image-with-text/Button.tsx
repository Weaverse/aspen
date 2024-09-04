import {
  InspectorGroup,
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {forwardRef} from 'react';
import clsx from 'clsx';

import {Link} from '~/components';

export interface ButtonProps {
  button1Text: string;
  link1: string;
  button2Text: string;
  link2: string;
  openInNewTab: boolean;
  width: number;
  height: number;
  borderRadius: number;
  blockWidth: number;
  button2Style: string;
  button1Style: string;
}

interface Props extends ButtonProps, Partial<HydrogenComponentProps> {}

let Button = forwardRef<HTMLElement, Props>((props, ref) => {
  let {
    button1Text,
    link1,
    width,
    height,
    button2Text,
    link2,
    blockWidth,
    button2Style,
    button1Style,
    openInNewTab,
    ...rest
  } = props;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {' '}
      <div
        style={{width: blockWidth}}
        className="flex flex-row items-center justify-between"
      >
        <Link
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          {...rest}
          to={link1 || '/'}
          target={openInNewTab ? '_blank' : '_self'}
          rel="noreferrer"
          className={clsx(
            'flex cursor-pointer justify-center py-2 px-4 rounded sm-max:px-3',
            button1Style,
          )}
        >
          {button1Text}
        </Link>
        <Link
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          {...rest}
          to={link2 || '/'}
          target={openInNewTab ? '_blank' : '_self'}
          rel="noreferrer"
          className={clsx(
            'flex cursor-pointer justify-center py-2 px-4 rounded sm-max:px-3',
            button2Style,
          )}
        >
          {button2Text}
        </Link>
      </div>
    </div>
  );
});

export default Button;

export let buttonInputs: InspectorGroup['inputs'] = [
  {
    type: 'range',
    name: 'blockWidth',
    label: 'Block width',
    defaultValue: 400,
    configs: {
      min: 90,
      max: 500,
      step: 1,
      unit: 'px',
    },
  },

  {
    type: 'text',
    name: 'button1Text',
    label: 'Button #1 label',
    defaultValue: 'Button #1',
    placeholder: 'Button #1',
  },
  {
    type: 'text',
    name: 'button2Text',
    label: 'Button #2 label',
    defaultValue: 'Button #2',
    placeholder: 'Button #2',
  },
  {
    type: 'url',
    name: 'link1',
    label: 'Button #1 link',
    defaultValue: '/products',
    placeholder: '/products',
  },
  {
    type: 'url',
    name: 'link2',
    label: 'Button #2 link',
    defaultValue: '/products',
    placeholder: '/products',
  },
  {
    type: 'switch',
    name: 'openInNewTab',
    label: 'Open in new tab',
    defaultValue: false,
  },
  {
    type: 'toggle-group',
    label: 'Button 1 style',
    name: 'button1Style',
    configs: {
      options: [
        {
          label: '1',
          value:
            'transition center hover:bg-white border-2 border-solid hover:border-gray-900 hover:text-black bg-black text-white',
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
    type: 'toggle-group',
    label: 'Button 2 style',
    name: 'button2Style',
    configs: {
      options: [
        {
          label: '1',
          value:
            'transition center hover:bg-white border-2 border-solid hover:border-gray-900 hover:text-black bg-black text-white',
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
];

export let schema: HydrogenComponentSchema = {
  type: 'image-with-text-button',
  title: 'Button',
  inspector: [
    {
      group: 'Button',
      inputs: buttonInputs,
    },
  ],
  toolbar: ['general-settings', ['duplicate', 'delete']],
};
