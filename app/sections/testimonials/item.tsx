import {Image} from '@shopify/hydrogen';
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
  WeaverseImage,
} from '@weaverse/hydrogen';
import clsx from 'clsx';
import {forwardRef} from 'react';

interface TestimonialItemProps extends HydrogenComponentProps {
  heading: string;
  content: string;
  authorImage: WeaverseImage;
  authorName: string;
  authorTitle: string;
  hideOnMobile: boolean;
  rating: number;
}
const StarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g id="Star">
      <path
        id="Vector"
        d="M18.6283 7.62875L18.6281 7.62831C18.5537 7.3942 18.4103 7.18805 18.2167 7.03687C18.0231 6.88569 17.7883 6.79655 17.5432 6.78113L17.5428 6.7811L12.9022 6.46079L12.8629 6.45808L12.8484 6.42147L11.1296 2.08553L11.1295 2.08537C11.0403 1.85826 10.8849 1.66319 10.6835 1.5254C10.4822 1.38765 10.2441 1.31349 10.0002 1.3125C9.75628 1.31349 9.51826 1.38765 9.31693 1.5254C9.11554 1.66319 8.96015 1.85826 8.87088 2.08537L8.87071 2.08578L7.12071 6.44516L7.10604 6.48171L7.06673 6.48425L2.45752 6.78111C2.45747 6.78111 2.45743 6.78112 2.45739 6.78112C2.2125 6.79757 1.97817 6.88711 1.78472 7.03816C1.59123 7.18924 1.44752 7.39491 1.3722 7.62855L1.37213 7.62875C1.29471 7.86619 1.29018 8.12139 1.35914 8.36142C1.42811 8.60146 1.56739 8.81534 1.75904 8.97548L1.75932 8.97572L5.3062 11.9757L5.33604 12.001L5.32641 12.0388L4.27172 16.1873L4.27164 16.1876C4.20182 16.4561 4.21439 16.7394 4.3077 17.0007C4.40097 17.2619 4.57063 17.4889 4.79462 17.6525C5.01185 17.8083 5.27064 17.8958 5.53789 17.9038C5.80516 17.9118 6.06874 17.8399 6.2949 17.6972L18.6283 7.62875ZM18.6283 7.62875C18.7057 7.86619 18.7102 8.12139 18.6413 8.36142C18.5723 8.60142 18.4331 8.81526 18.2415 8.97539L18.6283 7.62875ZM9.95896 15.3769L6.29499 17.6971L18.2414 8.97548L14.7102 11.9129L14.6802 11.9379L14.6895 11.9759L15.8067 16.5149L15.8067 16.5149L15.8071 16.5163C15.8559 16.6973 15.8626 16.8872 15.8267 17.0712C15.7907 17.2552 15.713 17.4286 15.5996 17.5779C15.4862 17.7272 15.34 17.8486 15.1724 17.9326C15.0049 18.0165 14.8203 18.061 14.633 18.0625C14.4037 18.0614 14.1796 17.9944 13.9874 17.8695L13.9867 17.869L10.0414 15.3768L10.0261 15.3672H10.008H9.9924H9.97427L9.95896 15.3769Z"
        fill="#211F1C"
        stroke="#211F1C"
        strokeWidth="0.125"
      />
    </g>
  </svg>
);
const RatingStars = ({rating}: {rating: number}) => {
  return (
    <div className="flex">
      {[...Array(rating)].map((_, index) => (
        <StarIcon key={index} />
      ))}
    </div>
  );
};

let TestimonialItem = forwardRef<HTMLDivElement, TestimonialItemProps>(
  (props, ref) => {
    let {
      heading,
      content,
      authorImage,
      authorName,
      authorTitle,
      rating,
      hideOnMobile,
      ...rest
    } = props;
    return (
      <div ref={ref} {...rest} className="m-4 border border-black">
        <figure className="p-6 bg-gray-50 rounded">
          <blockquote className="text-gray-500">
            <h4 className="font-medium text-gray-900">{heading}</h4>
            <RatingStars rating={rating} />
            <p
              className="my-4"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{__html: content}}
            />
          </blockquote>
          <figcaption className="flex items-center space-x-3">
            <Image
              className="h-9 rounded-full object-cover object-center"
              data={
                typeof authorImage === 'object'
                  ? authorImage
                  : {url: authorImage}
              }
              alt={authorName}
              width={36}
              sizes="auto"
            />
            <div className="space-y-0.5 font-medium">
              <div>{authorName}</div>
              <div className="text-sm font-light text-gray-500">
                {authorTitle}
              </div>
            </div>
          </figcaption>
        </figure>
      </div>
    );
  },
);

export default TestimonialItem;

export let schema: HydrogenComponentSchema = {
  type: 'testimonial--item',
  title: 'Testimonial',
  inspector: [
    {
      group: 'Testimonial',
      inputs: [
        {
          type: 'text',
          name: 'heading',
          label: 'Heading',
          defaultValue: 'Reliable international shipping',
          placeholder: 'Testimonial heading',
        },
        {
          type: 'range',
          name: 'rating',
          label: 'Rating',
          configs: {
            min: 1,
            max: 5,
            step: 1,
          },
        },

        {
          type: 'textarea',
          name: 'content',
          label: 'Content',
          defaultValue: `I've ordered to multiple countries without issue. Their calculated duties/taxes and import fees make international delivery transparent.`,
          placeholder: 'Testimonial content',
        },
        {
          type: 'image',
          name: 'authorImage',
          label: 'Author image',
          defaultValue:
            'https://cdn.shopify.com/s/files/1/0728/0410/6547/files/wv-fashion-model-in-fur.jpg?v=1694236467',
        },
        {
          type: 'text',
          name: 'authorName',
          label: 'Author Name',
          defaultValue: 'Emma Thomas',
          placeholder: 'Author name',
        },
        {
          type: 'text',
          name: 'authorTitle',
          label: 'Author Title',
          defaultValue: 'International Customer',
          placeholder: 'Author title',
        },
      ],
    },
  ],
  toolbar: ['general-settings', ['duplicate', 'delete']],
};
