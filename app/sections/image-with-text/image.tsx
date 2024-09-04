import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
  WeaverseImage,
} from '@weaverse/hydrogen';
import {forwardRef} from 'react';
import {Image} from '@shopify/hydrogen';

import {IconImageBlank} from '~/components';

interface ImageItemsProps extends HydrogenComponentProps {
  image: WeaverseImage;
  enableLazyLoad: boolean;
}

let ImageItems = forwardRef<HTMLDivElement, ImageItemsProps>((props, ref) => {
  let {image, enableLazyLoad, ...rest} = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex flex-1 items-center justify-center sm-max:order-first sm-max:w-full sm-max:py-10 sm-max:pb-0 sm-max:justify-center"
    >
      {image ? (
        <Image
          data={image}
          loading={enableLazyLoad ? 'lazy' : 'eager'}
          sizes="auto"
          className="!w-full !aspect-square sm-max:!w-full"
        />
      ) : (
        <div className="flex justify-center items-center bg-gray-200 w-1/2 aspect-square">
          <IconImageBlank
            className="h-32 w-32 opacity-80"
            viewBox="0 0 100 100"
          />
        </div>
      )}
    </div>
  );
});

export default ImageItems;

export let schema: HydrogenComponentSchema = {
  type: 'image-with-text--image',
  title: 'Image',
  toolbar: ['general-settings', ['duplicate', 'delete']],
  limit: 1,
  inspector: [
    {
      group: 'Image',
      inputs: [
        {
          type: 'image',
          name: 'image',
          label: 'Image',
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
};
