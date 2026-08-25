import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { cn } from "~/utils/cn";

// Submissions are recorded as Klaviyo events; see docs/integrations.md.
type ContactApiPayload = { ok: boolean; error?: string };

interface ContactFormProps extends SectionProps {
  headingContent?: string;
  description?: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  messagePlaceholder?: string;
  buttonText?: string;
  successText?: string;
}

const INPUT_CLASSES = cn(
  "w-full rounded-(--radius-sm) border border-(--color-line)",
  "bg-(--color-background) px-3 py-[11px]",
  "font-body text-(--color-text) text-sm leading-[1.6] tracking-[0.01em]",
  "placeholder:text-(--color-text-light)",
  "focus:border-(--color-text) focus:outline-hidden",
);

const ContactForm = forwardRef<HTMLElement, ContactFormProps>((props, ref) => {
  const {
    headingContent = "Contact Us",
    description = "Let us know if you have any question",
    namePlaceholder = "Your name",
    emailPlaceholder = "Your email",
    messagePlaceholder = "Message",
    buttonText = "Send message",
    successText = "Thank you! We will get back to you soon.",
    backgroundColor = "#EDEDED",
    containerClassName,
    ...rest
  } = props;
  const fetcher = useFetcher();
  const { state, Form } = fetcher;
  const data = fetcher.data as ContactApiPayload | undefined;
  const { ok, error } = data || {};

  return (
    <Section
      ref={ref}
      {...rest}
      backgroundColor={backgroundColor}
      backgroundFor="section"
      containerClassName={cn(
        "flex w-full flex-col items-center px-5 py-16 md:px-10",
        containerClassName,
      )}
      gap={0}
      verticalPadding="none"
      width="full"
    >
      {headingContent && (
        <h4
          className="w-full text-center font-heading font-normal text-(--color-text) text-[32px] leading-[1.1] tracking-[-0.02em] md:text-[37px]"
          data-motion="fade-up"
        >
          {headingContent}
        </h4>
      )}
      {description && (
        <p
          className="mt-5 w-full text-center font-body text-(--color-text) text-sm leading-[1.6] tracking-[0.01em] md:mx-auto md:max-w-[520px]"
          data-motion="fade-up"
        >
          {description}
        </p>
      )}
      <Form
        method="POST"
        action="/api/contact"
        className="mt-8 flex w-[280px] max-w-full flex-col gap-5"
        data-motion="fade-up"
      >
        <div className="flex flex-col gap-2">
          <input
            autoComplete="name"
            maxLength={200}
            name="name"
            type="text"
            placeholder={namePlaceholder}
            className={INPUT_CLASSES}
          />
          <input
            autoComplete="email"
            maxLength={254}
            name="email"
            type="email"
            required
            placeholder={emailPlaceholder}
            className={INPUT_CLASSES}
          />
          <textarea
            maxLength={5000}
            name="message"
            required
            placeholder={messagePlaceholder}
            className={cn(INPUT_CLASSES, "h-[90px] resize-none")}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={state !== "idle"}
          className="mx-auto w-fit py-[19px] font-semibold text-sm uppercase leading-none tracking-[0.02em]"
        >
          {buttonText}
        </Button>
        {ok && (
          <p
            aria-live="polite"
            className="text-center font-body text-(--color-text) text-sm leading-[1.6]"
          >
            {successText}
          </p>
        )}
        {!ok && error && (
          <p
            aria-live="polite"
            className="text-center font-body text-(--color-discount) text-sm leading-[1.6]"
            role="alert"
          >
            {error}
          </p>
        )}
      </Form>
    </Section>
  );
});

export default ContactForm;

export const schema = createSchema({
  type: "contact-form",
  title: "Contact form",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "headingContent",
          label: "Heading",
          defaultValue: "Contact Us",
        },
        {
          type: "text",
          name: "description",
          label: "Description",
          defaultValue: "Let us know if you have any question",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Send message",
        },
        {
          type: "text",
          name: "successText",
          label: "Success message",
          defaultValue: "Thank you! We will get back to you soon.",
        },
      ],
    },
    {
      group: "Form fields",
      inputs: [
        {
          type: "text",
          name: "namePlaceholder",
          label: "Name placeholder",
          defaultValue: "Your name",
        },
        {
          type: "text",
          name: "emailPlaceholder",
          label: "Email placeholder",
          defaultValue: "Your email",
        },
        {
          type: "text",
          name: "messagePlaceholder",
          label: "Message placeholder",
          defaultValue: "Message",
        },
      ],
    },
    {
      group: "Layout",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background color",
          defaultValue: "#EDEDED",
        },
      ],
    },
  ],
  presets: {
    headingContent: "Contact Us",
    description: "Let us know if you have any question",
    buttonText: "Send message",
  },
});
