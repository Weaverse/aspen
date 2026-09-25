import { createSchema, useTranslation } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { cn } from "~/utils/cn";
import { translateError } from "~/utils/translated-error";

// Submissions are recorded as Klaviyo events; see docs/integrations.md.
type ContactApiPayload = { ok: boolean; error?: string };

interface ContactFormProps extends SectionProps {
  layout?: "default" | "wide";
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
  const { t } = useTranslation();

  const translateText = useTranslatedText();

  const {
    layout = "default",
    headingContent: rawI18nHeadingContent = "Contact Us",
    description: rawI18nDescription = "Let us know if you have any question",
    namePlaceholder: rawI18nNamePlaceholder = "Your name",
    emailPlaceholder: rawI18nEmailPlaceholder = "Your email",
    messagePlaceholder: rawI18nMessagePlaceholder = "Message",
    buttonText: rawI18nButtonText = "Send message",
    successText:
      rawI18nSuccessText = "Thank you! We will get back to you soon.",
    backgroundColor = "#EDEDED",
    containerClassName,
    ...rest
  } = props;
  const successText = translateText(
    rawI18nSuccessText,
    "themeContent.sectionsContactFormIndex.successText",
  );
  const buttonText = translateText(
    rawI18nButtonText,
    "themeContent.sectionsContactFormIndex.buttonText",
  );
  const messagePlaceholder = translateText(
    rawI18nMessagePlaceholder,
    "themeContent.sectionsContactFormIndex.messagePlaceholder",
  );
  const emailPlaceholder = translateText(
    rawI18nEmailPlaceholder,
    "themeContent.sectionsContactFormIndex.emailPlaceholder",
  );
  const namePlaceholder = translateText(
    rawI18nNamePlaceholder,
    "themeContent.sectionsContactFormIndex.namePlaceholder",
  );
  const description = translateText(
    rawI18nDescription,
    "themeContent.sectionsContactFormIndex.description",
  );
  const headingContent = translateText(
    rawI18nHeadingContent,
    "themeContent.sectionsContactFormIndex.headingContent",
  );
  const action = usePrefixPathWithLocale("/api/contact");
  const wide = layout === "wide";
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
        wide && "!px-0 !py-0",
        containerClassName,
      )}
      gap={0}
      verticalPadding="none"
      width="full"
    >
      {headingContent && (
        <h4
          className={cn(
            "w-full text-center font-heading font-normal text-(--color-text) text-[32px] leading-[1.1] tracking-[-0.02em] md:text-[37px]",
            wide &&
              "text-left text-[32px] uppercase [overflow-wrap:anywhere] md:text-[37px]",
          )}
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
        action={action}
        className={cn(
          "mt-8 flex w-[280px] max-w-full flex-col gap-5",
          wide && "mt-6 w-full gap-4",
        )}
        data-motion="fade-up"
      >
        <div className={cn("flex flex-col gap-2", wide && "gap-4")}>
          <input
            autoComplete="name"
            maxLength={200}
            name="name"
            type="text"
            placeholder={namePlaceholder}
            aria-label={namePlaceholder}
            className={cn(INPUT_CLASSES, wide && "rounded-none xl:rounded-lg")}
          />
          <input
            autoComplete="email"
            maxLength={254}
            name="email"
            type="email"
            required
            placeholder={emailPlaceholder}
            aria-label={emailPlaceholder}
            className={cn(INPUT_CLASSES, wide && "rounded-none xl:rounded-lg")}
          />
          <textarea
            maxLength={5000}
            name="message"
            required
            placeholder={messagePlaceholder}
            aria-label={messagePlaceholder}
            className={cn(
              INPUT_CLASSES,
              "h-[90px] resize-y",
              wide && "h-32 rounded-none xl:rounded-lg",
            )}
          />
        </div>
        <Button
          type="submit"
          variant={wide ? "secondary" : "primary"}
          disabled={state !== "idle"}
          className={cn(
            "mx-auto w-fit font-semibold text-sm uppercase leading-none tracking-[0.02em]",
            wide && "mx-0 self-start",
          )}
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
            {translateError(t, error)}
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
