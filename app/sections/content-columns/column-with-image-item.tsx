import {Image} from '@shopify/hydrogen';
import {
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
  type WeaverseImage,
} from '@weaverse/hydrogen';
import clsx from 'clsx';
import {forwardRef} from 'react';

import {FALLBACK_IMAGE} from '~/lib/const';
import type {Alignment} from '~/lib/type';
import {Link} from '~/components';

import {ButtonProps} from '../shared/Button';
interface ColumnWithImageItemProps extends ButtonProps, HydrogenComponentProps {
  imageSrc: WeaverseImage;
  heading: string;
  content: string;
  buttonText: string;
  linkButton: string;
  hideOnMobile: boolean;
  buttonStyle: string;
  enableLazyLoad: boolean;
  size: 'large' | 'medium';
  alignment?: Alignment;
}
let alignmentClasses: Record<Alignment, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};
let sizeMap = {
  large: 'col-span-6',
  medium: 'col-span-4',
};

let ColumnWithImageItem = forwardRef<HTMLDivElement, ColumnWithImageItemProps>(
  (props, ref) => {
    let {
      imageSrc,
      heading,
      content,
      text,
      link,
      variant,
      openInNewTab,
      enableLazyLoad,
      alignment,
      buttonStyle,
      size,
      buttonText,
      linkButton,
      ...rest
    } = props;

    let imageData =
      typeof imageSrc === 'object'
        ? imageSrc
        : {url: imageSrc || FALLBACK_IMAGE, altText: imageSrc};
    return (
      <div ref={ref} {...rest} className={clsx(sizeMap[size])}>
        <Image
          data={imageData}
          loading={enableLazyLoad ? 'lazy' : 'eager'}
          sizes="auto"
          className="aspect-square object-cover object-center w-full rounded-lg"
        />
        <div
          className={clsx(
            'w-full space-y-3 mt-6',
            alignmentClasses[alignment!],
          )}
        >
          {heading && <h3 className="font-medium">{heading}</h3>}
          {content && <p>{content}</p>}
          <Link
            ref={ref as React.ForwardedRef<HTMLAnchorElement>}
            {...rest}
            to={link || '/'}
            target={openInNewTab ? '_blank' : '_self'}
            rel="noreferrer"
            className={clsx(
              'flex cursor-pointer justify-center py-2 px-4 rounded sm-max:px-3',
              buttonStyle,
            )}
          >
            {buttonText}
          </Link>
        </div>
      </div>
    );
  },
);

export default ColumnWithImageItem;

export let schema: HydrogenComponentSchema = {
  type: 'content-with-image-item',
  title: 'Content columns',
  toolbar: ['general-settings', ['duplicate', 'delete']],
  inspector: [
    {
      group: 'Column',
      inputs: [
        {
          type: 'image',
          name: 'imageSrc',
          label: 'Image',
        },
        {
          type: 'text',
          name: 'heading',
          label: 'Title',
          placeholder: 'Enter a title',
          defaultValue: 'Item title',
        },
        {
          type: 'toggle-group',
          name: 'alignment',
          label: 'Alignment',
          configs: {
            options: [
              {value: 'left', label: 'Left'},
              {value: 'center', label: 'Center'},
              {value: 'right', label: 'Right'},
            ],
          },
          defaultValue: 'center',
        },
        {
          type: 'richtext',
          label: 'Text',
          name: 'content',
          placeholder:
            'Use this section to promote content throughout every page of your site. Add images for further impact.',
          defaultValue:
            'Use this section to promote content throughout every page of your site. Add images for further impact.',
        },
        {
          type: 'select',
          name: 'size',
          label: 'Size',
          configs: {
            options: [
              {
                label: 'Large',
                value: 'large',
              },
              {
                label: 'Medium',
                value: 'medium',
              },
            ],
          },
          defaultValue: 'medium',
        },
        // {
        //   type: 'switch',
        //   label: 'Hide on Mobile',
        //   name: 'hideOnMobile',
        //   defaultValue: false,
        // },
        {
          type: 'text',
          name: 'buttonText',
          label: 'Button label',
          defaultValue: 'Button',
          placeholder: 'Button',
        },
        {
          type: 'url',
          name: 'linkButton',
          label: 'Button link',
          defaultValue: '/products',
          placeholder: 'https://',
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
          type: 'switch',
          name: 'openInNewTab',
          label: 'Open in new tab',
          defaultValue: false,
        },
        {
          type: 'switch',
          label: 'Lazy load image',
          name: 'enableLazyLoad',
          defaultValue: true,
        },
      ],
    },
  ],
  presets: {
    imageSrc:
      'https://cdn.shopify.com/s/files/1/0838/0052/3057/files/h2-placeholder-image.svg',
  },
};
