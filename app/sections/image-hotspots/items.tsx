import type {
  ComponentLoaderArgs,
  HydrogenComponentProps,
  HydrogenComponentSchema,
  WeaverseProduct,
} from '@weaverse/hydrogen';
import {getSelectedProductOptions} from '@weaverse/hydrogen';
import type {CSSProperties} from 'react';
import {forwardRef} from 'react';
import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';

import type {ProductQuery} from 'storefrontapi.generated';
import {PRODUCT_QUERY} from '~/data/queries';
import {IconImageBlank, Link} from '~/components';

type ProductData = {
  verticalPosition: number;
  horizontalPosition: number;
  product: WeaverseProduct;
};

type ProductsHotspotProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  ProductData;

let ProductHotspotItems = forwardRef<HTMLDivElement, ProductsHotspotProps>(
  (props, ref) => {
    let {product, verticalPosition, horizontalPosition, loaderData, ...rest} =
      props;

    let Horizontal =
      horizontalPosition >= 50 ? 'left-auto right-1/2' : 'right-auto left-1/2';
    let Vertical =
      verticalPosition >= 50 ? 'top-auto bottom-full' : 'bottom-auto top-full';

    let sectionStyle: CSSProperties = {
      left: `${horizontalPosition}%`,
      top: `${verticalPosition}%`,
    } as CSSProperties;

    if (!loaderData) {
      return (
        <div className="absolute group flex flex-col" style={sectionStyle}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="52"
            height="52"
            viewBox="0 0 52 52"
            fill="none"
          >
            <g filter="url(#filter0_d_605_8193)">
              <rect
                x="8"
                y="8"
                width="36"
                height="36"
                rx="18"
                fill="white"
                shape-rendering="crispEdges"
              />
              <rect
                x="6"
                y="6"
                width="40"
                height="40"
                rx="20"
                stroke="black"
                stroke-opacity="0.1"
                stroke-width="4"
                shape-rendering="crispEdges"
              />
              <path
                d="M32.7499 31.1625L32.7033 31.1209C32.6143 31.2208 32.5052 31.3006 32.3831 31.3552C32.261 31.4097 32.1288 31.4378 31.9951 31.4375H31.9949H20.0001C19.8672 31.4371 19.7358 31.4088 19.6146 31.3542C19.4934 31.2997 19.385 31.2202 19.2966 31.1209C19.2089 31.0222 19.143 30.906 19.1033 30.78C19.0637 30.654 19.0511 30.521 19.0664 30.3898C19.0664 30.3898 19.0664 30.3898 19.0664 30.3897L19.9576 22.8899L19.9576 22.8898C19.9847 22.6608 20.0953 22.4497 20.2683 22.2971C20.4413 22.1444 20.6644 22.0609 20.8951 22.0625H20.8955H22.9999H23.0624V22C23.0624 21.2209 23.3719 20.4738 23.9228 19.9229C24.4737 19.372 25.2208 19.0625 25.9999 19.0625C26.779 19.0625 27.5262 19.372 28.077 19.9229C28.6279 20.4738 28.9374 21.2209 28.9374 22V22.0625H28.9999L31.1018 22.0625L31.1022 22.0625C31.3329 22.0609 31.5561 22.1444 31.729 22.2971C31.902 22.4497 32.0126 22.6608 32.0397 22.8898L32.0397 22.8899L32.931 30.3899L32.931 30.3899C32.9466 30.521 32.9344 30.6539 32.8951 30.7799C32.8558 30.9059 32.7904 31.0222 32.7031 31.1211L32.7499 31.1625ZM32.7499 31.1625C32.8431 31.0569 32.9129 30.9329 32.9548 30.7985C32.9967 30.664 33.0097 30.5223 32.993 30.3825L19.2499 31.1625C19.3442 31.2683 19.4597 31.3531 19.5889 31.4112C19.7182 31.4694 19.8582 31.4996 19.9999 31.5H31.9949C32.1375 31.5003 32.2785 31.4704 32.4086 31.4122C32.5388 31.3541 32.6551 31.2689 32.7499 31.1625ZM22.9374 22H20.8955C20.6495 21.9983 20.4114 22.0874 20.2269 22.2502C20.0424 22.413 19.9245 22.6381 19.8955 22.8825L22.9374 22ZM27.9999 22.0625H28.0624V22C28.0624 21.453 27.8451 20.9284 27.4583 20.5416C27.0715 20.1548 26.5469 19.9375 25.9999 19.9375C25.4529 19.9375 24.9283 20.1548 24.5415 20.5416C24.1547 20.9284 23.9374 21.453 23.9374 22V22.0625H23.9999H27.9999ZM19.9379 30.4926L19.9295 30.5625H19.9999H31.9949H32.0652L32.057 30.4927L31.1714 22.9927L31.1649 22.9375H31.1093H20.8955H20.8401L20.8335 22.9926L19.9379 30.4926Z"
                fill="#211F1C"
                stroke="#A79D95"
                stroke-width="0.125"
              />
            </g>
            <defs>
              <filter
                id="filter0_d_605_8193"
                x="0"
                y="0"
                width="52"
                height="52"
                filterUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB"
              >
                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset />
                <feGaussianBlur stdDeviation="2" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_605_8193"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_605_8193"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
          <div
            className={clsx(
              'hidden z-20 aspect-[2/1] bg-white absolute group-hover:flex flex-row justify-center items-center w-96 sm-max:w-36',
              Horizontal,
              Vertical,
            )}
          >
            <div className="w-1/2 bg-gray-300 h-full flex justify-center items-center">
              <IconImageBlank className="!w-9 !h-9" viewBox="0 0 100 100" />
            </div>
            <div className="text-center w-1/2 flex flex-col gap-2 justify-center items-center sm-max:gap-1">
              <p className="box-border font-medium text text-[10px] sm:text-sm">
                Product title
              </p>
              <p className="box-content font-normal text-[10px] sm:text-sm">
                0.00 $
              </p>
              <p className="box-content font-normal text-[10px] sm:text-sm">
                Please select product
              </p>
            </div>
          </div>
        </div>
      );
    }

    const ProductImage = loaderData?.product?.variants.nodes.map(
      (variant) => variant.image,
    );
    const ProductPrice =
      loaderData?.product?.variants.nodes.map(
        (variant) => variant.price.amount,
      ) || '0.00';
    const ProductCurrency =
      loaderData?.product?.variants.nodes.map(
        (variant) => variant.price.currencyCode,
      ) || '$';
    const ProductTittle = loaderData?.product?.title || 'Product title';

    return (
      <div
        ref={ref}
        {...rest}
        className="absolute group flex flex-col"
        style={sectionStyle}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="52"
          height="52"
          viewBox="0 0 52 52"
          fill="none"
        >
          <g filter="url(#filter0_d_605_8193)">
            <rect
              x="8"
              y="8"
              width="36"
              height="36"
              rx="18"
              fill="white"
              shape-rendering="crispEdges"
            />
            <rect
              x="6"
              y="6"
              width="40"
              height="40"
              rx="20"
              stroke="black"
              stroke-opacity="0.1"
              stroke-width="4"
              shape-rendering="crispEdges"
            />
            <path
              d="M32.7499 31.1625L32.7033 31.1209C32.6143 31.2208 32.5052 31.3006 32.3831 31.3552C32.261 31.4097 32.1288 31.4378 31.9951 31.4375H31.9949H20.0001C19.8672 31.4371 19.7358 31.4088 19.6146 31.3542C19.4934 31.2997 19.385 31.2202 19.2966 31.1209C19.2089 31.0222 19.143 30.906 19.1033 30.78C19.0637 30.654 19.0511 30.521 19.0664 30.3898C19.0664 30.3898 19.0664 30.3898 19.0664 30.3897L19.9576 22.8899L19.9576 22.8898C19.9847 22.6608 20.0953 22.4497 20.2683 22.2971C20.4413 22.1444 20.6644 22.0609 20.8951 22.0625H20.8955H22.9999H23.0624V22C23.0624 21.2209 23.3719 20.4738 23.9228 19.9229C24.4737 19.372 25.2208 19.0625 25.9999 19.0625C26.779 19.0625 27.5262 19.372 28.077 19.9229C28.6279 20.4738 28.9374 21.2209 28.9374 22V22.0625H28.9999L31.1018 22.0625L31.1022 22.0625C31.3329 22.0609 31.5561 22.1444 31.729 22.2971C31.902 22.4497 32.0126 22.6608 32.0397 22.8898L32.0397 22.8899L32.931 30.3899L32.931 30.3899C32.9466 30.521 32.9344 30.6539 32.8951 30.7799C32.8558 30.9059 32.7904 31.0222 32.7031 31.1211L32.7499 31.1625ZM32.7499 31.1625C32.8431 31.0569 32.9129 30.9329 32.9548 30.7985C32.9967 30.664 33.0097 30.5223 32.993 30.3825L19.2499 31.1625C19.3442 31.2683 19.4597 31.3531 19.5889 31.4112C19.7182 31.4694 19.8582 31.4996 19.9999 31.5H31.9949C32.1375 31.5003 32.2785 31.4704 32.4086 31.4122C32.5388 31.3541 32.6551 31.2689 32.7499 31.1625ZM22.9374 22H20.8955C20.6495 21.9983 20.4114 22.0874 20.2269 22.2502C20.0424 22.413 19.9245 22.6381 19.8955 22.8825L22.9374 22ZM27.9999 22.0625H28.0624V22C28.0624 21.453 27.8451 20.9284 27.4583 20.5416C27.0715 20.1548 26.5469 19.9375 25.9999 19.9375C25.4529 19.9375 24.9283 20.1548 24.5415 20.5416C24.1547 20.9284 23.9374 21.453 23.9374 22V22.0625H23.9999H27.9999ZM19.9379 30.4926L19.9295 30.5625H19.9999H31.9949H32.0652L32.057 30.4927L31.1714 22.9927L31.1649 22.9375H31.1093H20.8955H20.8401L20.8335 22.9926L19.9379 30.4926Z"
              fill="#211F1C"
              stroke="#A79D95"
              stroke-width="0.125"
            />
          </g>
          <defs>
            <filter
              id="filter0_d_605_8193"
              x="0"
              y="0"
              width="52"
              height="52"
              filterUnits="userSpaceOnUse"
              color-interpolation-filters="sRGB"
            >
              <feFlood flood-opacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
              />
              <feBlend
                mode="normal"
                in2="BackgroundImageFix"
                result="effect1_dropShadow_605_8193"
              />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_605_8193"
                result="shape"
              />
            </filter>
          </defs>
        </svg>
        <div
          className={clsx(
            'hidden z-20 aspect-[2/1] bg-white absolute group-hover:flex flex-row justify-center items-center w-96 sm-max:w-36',
            Horizontal,
            Vertical,
          )}
        >
          <div className="w-1/2 bg-gray-300 h-full flex justify-center items-center aspect-square">
            {ProductImage ? (
              ProductImage.map((image, index) => (
                <Image key={index} data={image ?? {}} sizes="auto" />
              ))
            ) : (
              <IconImageBlank className="!w-9 !h-9" viewBox="0 0 100 100" />
            )}
          </div>
          <div className="text-center w-1/2 flex flex-col gap-2 justify-center items-center sm-max:gap-1">
            <p className="box-border font-medium text text-[10px] sm:text-sm">
              {ProductTittle}
            </p>
            <p className="box-content font-normal text-[10px] sm:text-sm">{`${ProductPrice} ${ProductCurrency}`}</p>
            {product.handle && (
              <Link
                to={`/products/${product.handle}`}
                className="text-[10px] sm:text-sm underline"
              >
                See details
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default ProductHotspotItems;

export let loader = async (args: ComponentLoaderArgs<ProductData>) => {
  let {weaverse, data} = args;
  let {storefront, request} = weaverse;
  if (data.product) {
    return await storefront.query<ProductQuery>(PRODUCT_QUERY, {
      variables: {
        handle: data.product.handle,
        selectedOptions: getSelectedProductOptions(request),
        language: storefront.i18n.language,
        country: storefront.i18n.country,
      },
    });
  }
  return null;
};

export let schema: HydrogenComponentSchema = {
  type: 'product-hotspot--items',
  title: 'Product hotspot items',
  inspector: [
    {
      group: 'Hotspot',
      inputs: [
        {
          type: 'product',
          name: 'product',
          label: 'Product',
        },
        {
          type: 'range',
          name: 'verticalPosition',
          label: 'Vertical position',
          defaultValue: 50,
          configs: {
            min: 5,
            max: 90,
            step: 5,
            unit: '%',
          },
        },
        {
          type: 'range',
          name: 'horizontalPosition',
          label: 'Horizontal position',
          defaultValue: 50,
          configs: {
            min: 5,
            max: 90,
            step: 5,
            unit: '%',
          },
        },
      ],
    },
  ],
};
