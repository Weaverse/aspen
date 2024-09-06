import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
  WeaverseImage,
} from '@weaverse/hydrogen';
import {forwardRef} from 'react';
import {Image} from '@shopify/hydrogen';

import {IconImageBlank} from '~/components';

interface PromotionItemProps extends HydrogenComponentProps {
  backgroundImage: WeaverseImage;
  enableLazyLoad: boolean;
}

let PromotionGridItem = forwardRef<HTMLDivElement, PromotionItemProps>(
  (props, ref) => {
    let {backgroundImage, enableLazyLoad, children, ...rest} = props;
    return (
      <div ref={ref} {...rest} className="relative w-96 aspect-video">
        <div className="absolute inset-0">
          {backgroundImage ? (
            <Image
              loading={enableLazyLoad ? 'lazy' : 'eager'}
              data={backgroundImage}
              sizes="auto"
              className="w-full h-full object-cover "
            />
          ) : (
            <div className="w-full h-full flex justify-center items-center bg-black bg-opacity-5">
              <IconImageBlank
                viewBox="0 0 100 101"
                className="!w-24 !h-24 opacity-20"
              />
            </div>
          )}
        </div>
        <div className="relative flex flex-col items-center z-10 w-full py-10">
          <div className="w-5/6 flex flex-col text-center items-center gap-5">
            {children}
          </div>
        </div>
      </div>
    );
  },
);

export default PromotionGridItem;

export let schema: HydrogenComponentSchema = {
  type: 'promotion-item',
  title: 'Promotion',
  toolbar: ['general-settings', ['duplicate', 'delete']],
  inspector: [
    {
      group: 'Promotion',
      inputs: [
        {
          type: 'image',
          name: 'backgroundImage',
          label: 'Background image',
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
  childTypes: [
    'subheading',
    'heading',
    'description',
    'image-with-text-button',
  ],
  presets: {
    children: [
      {
        type: 'subheading',
        content: 'Subheading',
      },
      {
        type: 'heading',
        content: 'Heading for Image',
      },
      {
        type: 'description',
        content:
          'Include the smaller details of your promotion in text below the title.',
      },
      {
        type: 'image-with-text-button',
      },
    ],
  },
};
