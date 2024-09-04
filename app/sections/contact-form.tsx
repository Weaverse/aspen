import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {forwardRef} from 'react';
import {Form} from '@remix-run/react';
import type {CSSProperties} from 'react';
import clsx from 'clsx';

import {Button, Input} from '~/components';

type ContactFormData = {
  contentAlignment: string;
  sectionHeight: string;
  backgroundColor: string;
  subheading: string;
  heading: string;
  buttonLabel: string;
  buttonLink: string;
  openInNewTab: boolean;
  buttonStyle: string;
  topPadding: string;
  bottomPadding: string;
};

type ContactFormProps = HydrogenComponentProps & ContactFormData;

let ContactForm = forwardRef<HTMLDivElement, ContactFormProps>((props, ref) => {
  let {
    loaderData,
    contentAlignment,
    sectionHeight,
    backgroundColor,
    subheading,
    heading,
    buttonLabel,
    buttonLink,
    openInNewTab,
    buttonStyle,
    topPadding,
    bottomPadding,
    ...rest
  } = props;
  let sectionStyle: CSSProperties = {
    '--section-height': `${sectionHeight}px`,
    backgroundColor: `${backgroundColor}`,
    paddingTop: `${topPadding}px`,
    paddingBottom: `${bottomPadding}px`,
  } as CSSProperties;
  let headingStyle: CSSProperties = {
    alignItems: `${contentAlignment}`,
  } as CSSProperties;
  return (
    <section
      ref={ref}
      {...rest}
      className="w-full px-10 h-[var(--section-height)] flex flex-col justify-center sm-max:px-8"
      style={sectionStyle}
    >
      <Form
        action="/contact"
        method="POST"
        encType="multipart/form-data"
        navigate={false}
        className="w-80 mx-auto p-4 text-center"
      >
        <div className="space-y-2 flex flex-col" style={headingStyle}>
          <label className="text-2xl font-medium">{heading}</label>
          <p className="">{subheading}</p>
        </div>
        <div className="space-y-2 mt-8 mb-5">
          <Input type="text" name="name" label="Name" placeholder="Name" />
          <Input type="email" name="email" label="Email" placeholder="Email" />
          <Input
            type="text"
            name="subject"
            label="Subject"
            placeholder="Subject"
          />
          <textarea
            className="resize-none w-full p-2.5 border rounded-sm focus-visible:outline-none focus:border-bar/50 border-bar/10"
            rows={4}
            name="message"
            placeholder="Message"
          />
        </div>
        {buttonLabel && (
          <a
            href={buttonLink}
            target={openInNewTab ? '_blank' : ''}
            className={clsx(
              'flex cursor-pointer py-2 px-4 rounded sm-max:px-3 justify-center items-center  w-fit mx-auto',
              buttonStyle,
            )}
            rel="noreferrer"
          >
            {buttonLabel}
          </a>
        )}
      </Form>
    </section>
  );
});

export default ContactForm;

export let schema: HydrogenComponentSchema = {
  type: 'contact-form',
  title: 'Contact form',
  limit: 1,
  enabledOn: {
    pages: ['INDEX'],
  },
  inspector: [
    {
      group: 'Contact form',
      inputs: [
        {
          type: 'color',
          name: 'backgroundColor',
          label: 'Background',
          defaultValue: '#00000',
        },
        {
          type: 'toggle-group',
          label: 'Content alignment',
          name: 'contentAlignment',
          configs: {
            options: [
              {label: 'Left', value: 'flex-start'},
              {label: 'Center', value: 'center'},
              {label: 'Right', value: 'flex-end'},
            ],
          },
          defaultValue: 'center',
        },
        {
          type: 'text',
          name: 'heading',
          label: 'Heading',
          defaultValue: 'Contact us',
        },
        {
          type: 'text',
          name: 'subheading',
          label: 'Subheading',
          defaultValue: 'Let us know if you have any question',
        },
        {
          type: 'text',
          label: 'Button label',
          name: 'buttonLabel',
          placeholder: 'Button label',
          defaultValue: 'Button',
        },
        {
          type: 'url',
          name: 'buttonLink',
          label: 'Button link',
          defaultValue: '/',
          placeholder: '/',
        },
        {
          type: 'switch',
          name: 'openInNewTab',
          label: 'Open in new tab',
          defaultValue: true,
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
                  'transition hover:bg-white border-2 border-solid hover:border-gray-900 hover:text-black bg-black text-white',
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
          type: 'range',
          name: 'sectionHeight',
          label: 'Section height',
          defaultValue: 500,
          configs: {
            min: 300,
            max: 700,
            step: 10,
            unit: 'px',
          },
        },
        {
          type: 'range',
          name: 'topPadding',
          label: 'Top padding',
          defaultValue: 10,
          configs: {
            min: 0,
            max: 100,
            step: 1,
            unit: 'px',
          },
        },
        {
          type: 'range',
          name: 'bottomPadding',
          label: 'Bottom padding',
          defaultValue: 10,
          configs: {
            min: 0,
            max: 100,
            step: 1,
            unit: 'px',
          },
        },
      ],
    },
  ],
};
