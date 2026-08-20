import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import clsx from "clsx";
import type { CSSProperties } from "react";
import { forwardRef } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import type { CustomerApiPlayLoad } from "~/routes/($locale).api.customer";
import { cn } from "~/utils/cn";

interface NewsletterFormProps extends HydrogenComponentProps {
  style?: CSSProperties;
  width?: number;
  placeholder?: string;
  buttonText?: string;
  helpText?: string;
  successText?: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputBorderColor?: string;
  placeholderColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  buttonHoverBackgroundColor?: string;
  buttonHoverTextColor?: string;
  borderRadius?: number;
  buttonWidth?: number;
}

const NewsletterForm = forwardRef<HTMLDivElement, NewsletterFormProps>(
  (props, ref) => {
    const {
      width = 372,
      placeholder = "Please enter your email",
      buttonText = "Send",
      helpText = "",
      successText = "Thank you for subscribing!",
      inputBackgroundColor = "#FFFFFF",
      inputTextColor = "#343231",
      inputBorderColor = "#9D9D9D",
      placeholderColor = "#979797",
      buttonBackgroundColor = "#4D4946",
      buttonTextColor = "#F1EEEA",
      buttonHoverBackgroundColor = "#FFFFFF",
      buttonHoverTextColor = "#000000",
      borderRadius = 8,
      buttonWidth = 83,
      className,
      style,
      ...rest
    } = props;
    const fetcher = useFetcher();
    const { state, Form } = fetcher;
    const data = fetcher.data as CustomerApiPlayLoad | undefined;
    const { ok, errorMessage } = data || {};

    return (
      <div
        ref={ref}
        {...rest}
        className={cn("newsletter-form mx-auto w-full max-w-full", className)}
        style={
          {
            ...style,
            width,
            "--newsletter-placeholder-color": placeholderColor,
          } as CSSProperties
        }
      >
        <Form
          method="POST"
          action="/api/customer"
          className="flex w-full items-stretch gap-2"
          data-motion="fade-up"
        >
          <input
            name="email"
            type="email"
            required
            placeholder={placeholder}
            className="h-[54px] min-w-0 flex-1 border px-4 font-body text-sm leading-[1.5] placeholder:text-[var(--newsletter-placeholder-color)] focus:outline-hidden"
            style={{
              backgroundColor: inputBackgroundColor,
              borderColor: inputBorderColor,
              borderRadius,
              color: inputTextColor,
            }}
          />
          <Button
            type="submit"
            variant="custom"
            animate={false}
            backgroundColor={buttonBackgroundColor}
            backgroundColorHover={buttonHoverBackgroundColor}
            borderColor={buttonBackgroundColor}
            borderColorHover={buttonHoverBackgroundColor}
            className="h-[54px] shrink-0 p-0 font-body text-sm leading-none"
            loading={state === "submitting"}
            style={{ borderRadius, width: buttonWidth }}
            textColor={buttonTextColor}
            textColorHover={buttonHoverTextColor}
          >
            {buttonText}
          </Button>
        </Form>

        {helpText && (
          <div
            className="mt-2 text-body-subtle"
            data-motion="fade-up"
            dangerouslySetInnerHTML={{ __html: helpText }}
          />
        )}

        {state === "idle" && data && (
          <div
            aria-live="polite"
            className={clsx(
              "mx-auto mt-4 text-center font-medium",
              ok ? "text-green-700" : "text-red-700",
            )}
          >
            {ok ? successText : errorMessage || "Something went wrong"}
          </div>
        )}
      </div>
    );
  },
);

export default NewsletterForm;

export const schema = createSchema({
  type: "newsletter-form",
  title: "Newsletter form",
  settings: [
    {
      group: "Form",
      inputs: [
        {
          type: "range",
          name: "width",
          label: "Form width",
          configs: {
            min: 300,
            max: 600,
            step: 1,
            unit: "px",
          },
          defaultValue: 372,
        },
        {
          type: "text",
          name: "placeholder",
          label: "Placeholder",
          defaultValue: "Please enter your email",
          placeholder: "Please enter your email",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          placeholder: "Send",
          defaultValue: "Send",
        },
        {
          type: "range",
          name: "buttonWidth",
          label: "Button width",
          configs: {
            min: 64,
            max: 180,
            step: 1,
            unit: "px",
          },
          defaultValue: 83,
        },
        {
          type: "richtext",
          name: "helpText",
          label: "Help text",
          defaultValue: "",
        },
        {
          type: "text",
          name: "successText",
          label: "Success message",
          placeholder: "Thank you for subscribing!",
          defaultValue: "Thank you for subscribing!",
        },
      ],
    },
    {
      group: "Style",
      inputs: [
        {
          type: "range",
          name: "borderRadius",
          label: "Field border radius",
          configs: {
            min: 0,
            max: 24,
            step: 1,
            unit: "px",
          },
          defaultValue: 8,
        },
        {
          type: "color",
          name: "inputBackgroundColor",
          label: "Input background",
          defaultValue: "#FFFFFF",
        },
        {
          type: "color",
          name: "inputTextColor",
          label: "Input text",
          defaultValue: "#343231",
        },
        {
          type: "color",
          name: "inputBorderColor",
          label: "Input border",
          defaultValue: "#9D9D9D",
        },
        {
          type: "color",
          name: "placeholderColor",
          label: "Placeholder text",
          defaultValue: "#979797",
        },
        {
          type: "color",
          name: "buttonBackgroundColor",
          label: "Button background",
          defaultValue: "#4D4946",
        },
        {
          type: "color",
          name: "buttonTextColor",
          label: "Button text",
          defaultValue: "#F1EEEA",
        },
        {
          type: "color",
          name: "buttonHoverBackgroundColor",
          label: "Button background on hover",
          defaultValue: "#FFFFFF",
        },
        {
          type: "color",
          name: "buttonHoverTextColor",
          label: "Button text on hover",
          defaultValue: "#000000",
        },
      ],
    },
  ],
});
