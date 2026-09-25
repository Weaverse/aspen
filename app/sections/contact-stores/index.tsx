import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { Section, type SectionProps } from "~/components/section";
import { useTranslatedText } from "~/hooks/use-translated-text";
import ContactForm from "~/sections/contact-form";

interface ContactStoresProps extends SectionProps {
  heading?: string;
  formHeading?: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  messagePlaceholder?: string;
  buttonText?: string;
  successText?: string;
}

const ContactStores = forwardRef<HTMLElement, ContactStoresProps>(
  (
    {
      heading: rawI18nHeading = "Our Stores",
      formHeading: rawI18nFormHeading = "Hear More From Us",
      children,
      namePlaceholder: rawI18nNamePlaceholder = "Your name",
      emailPlaceholder: rawI18nEmailPlaceholder = "Your email",
      messagePlaceholder: rawI18nMessagePlaceholder = "Message",
      buttonText: rawI18nButtonText = "Send",
      successText:
        rawI18nSuccessText = "Thank you! Your message has been received.",
      ...rest
    },
    ref,
  ) => {
    const translateText = useTranslatedText();
    const heading = translateText(
      rawI18nHeading,
      "themeContent.sectionsContactStoresIndex.heading",
    );
    const formHeading = translateText(
      rawI18nFormHeading,
      "themeContent.sectionsContactStoresIndex.formHeading",
    );
    const namePlaceholder = translateText(
      rawI18nNamePlaceholder,
      "themeContent.sectionsContactStoresIndex.namePlaceholder",
    );
    const emailPlaceholder = translateText(
      rawI18nEmailPlaceholder,
      "themeContent.sectionsContactStoresIndex.emailPlaceholder",
    );
    const messagePlaceholder = translateText(
      rawI18nMessagePlaceholder,
      "themeContent.sectionsContactStoresIndex.messagePlaceholder",
    );
    const buttonText = translateText(
      rawI18nButtonText,
      "themeContent.sectionsContactStoresIndex.buttonText",
    );
    const successText = translateText(
      rawI18nSuccessText,
      "themeContent.sectionsContactStoresIndex.successText",
    );
    return (
      <Section
        {...rest}
        ref={ref}
        width="full"
        verticalPadding="none"
        gap={0}
        backgroundColor="#FFFFFF"
      >
        <div className="mx-auto w-full max-w-[910px] px-5 py-16 md:px-8 md:pb-[84px] xl:max-w-[886px] xl:px-5">
          <h2 className="mb-6 font-heading font-normal text-[32px] uppercase leading-[1.15] tracking-[-0.02em] md:text-[37px]">
            {heading}
          </h2>
          <div className="flex flex-col gap-4">{children}</div>
          <div className="mt-16">
            <ContactForm
              layout="wide"
              headingContent={formHeading}
              description=""
              backgroundColor="#FFFFFF"
              namePlaceholder={namePlaceholder}
              emailPlaceholder={emailPlaceholder}
              messagePlaceholder={messagePlaceholder}
              buttonText={buttonText}
              successText={successText}
            />
          </div>
        </div>
      </Section>
    );
  },
);
export default ContactStores;
export const schema = createSchema({
  type: "contact-stores",
  title: "Contact — stores and form",
  childTypes: ["contact-store"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Stores heading",
          defaultValue: "Our Stores",
        },
        {
          type: "text",
          name: "formHeading",
          label: "Form heading",
          defaultValue: "Hear More From Us",
        },
        {
          type: "text",
          name: "namePlaceholder",
          label: "Name label",
          defaultValue: "Your name",
        },
        {
          type: "text",
          name: "emailPlaceholder",
          label: "Email label",
          defaultValue: "Your email",
        },
        {
          type: "text",
          name: "messagePlaceholder",
          label: "Message label",
          defaultValue: "Message",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Submit label",
          defaultValue: "Send",
        },
        {
          type: "text",
          name: "successText",
          label: "Success message",
          defaultValue: "Thank you! Your message has been received.",
        },
      ],
    },
  ],
  presets: {
    children: [
      { type: "contact-store" },
      { type: "contact-store", nameStore: "Store 2" },
    ],
  },
});
