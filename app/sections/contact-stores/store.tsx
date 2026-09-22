import { createSchema } from "@weaverse/hydrogen";
import { forwardRef, type HTMLAttributes } from "react";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { schema as addressSchema } from "~/sections/map/address";
import { MapFrame } from "~/sections/map/map";
import { cn } from "~/utils/cn";

interface StoreProps extends HTMLAttributes<HTMLDivElement> {
  nameStore?: string;
  address?: string;
  phoneNumber?: string;
  openingHours?: string;
  openingHoursSat?: string;
  itemIndex?: number;
}
const ContactStore = forwardRef<HTMLDivElement, StoreProps>(
  (
    {
      nameStore,
      address,
      phoneNumber,
      openingHours,
      openingHoursSat,
      itemIndex,
      className,
      ...rest
    },
    ref,
  ) => {
    const translateText = useTranslatedText();
    const translatedNameStore = translateText(
      nameStore,
      "themeContent.sectionsMapAddress.nameStore",
    );
    const translatedAddress = translateText(
      address,
      "themeContent.sectionsMapAddress.address",
    );
    const translatedOpeningHours = translateText(
      openingHours,
      "themeContent.sectionsMapAddress.openingHours",
    );
    const translatedOpeningHoursSat = translateText(
      openingHoursSat,
      "themeContent.sectionsMapAddress.openingHoursSat",
    );

    return (
      <div
        {...rest}
        ref={ref}
        className={cn(
          "grid overflow-hidden border border-[#DDD] md:grid-cols-2 xl:rounded-xl",
          className,
        )}
      >
        <div className="order-2 min-h-[280px] p-5 md:order-1">
          <h3 className="mb-6 font-heading font-normal text-[30px] uppercase leading-[1.15] md:text-[32px]">
            {translatedNameStore}
          </h3>
          <address className="font-body text-sm not-italic leading-[1.6]">
            {translatedAddress && <p>{translatedAddress}</p>}
            {phoneNumber && (
              <a
                className="underline"
                href={`tel:${phoneNumber.replace(/[^+\d]/g, "")}`}
              >
                {phoneNumber}
              </a>
            )}
          </address>
          {(translatedOpeningHours || translatedOpeningHoursSat) && (
            <div className="mt-6 text-sm leading-[1.6]">
              {translatedOpeningHours && <p>• {translatedOpeningHours}</p>}
              {translatedOpeningHoursSat && <p>{translatedOpeningHoursSat}</p>}
            </div>
          )}
        </div>
        {translatedAddress && (
          <MapFrame
            address={translatedAddress}
            className="order-1 aspect-auto h-[280px] md:order-2 lg:aspect-auto lg:rounded-none"
          />
        )}
      </div>
    );
  },
);
export default ContactStore;
export const schema = createSchema({
  type: "contact-store",
  title: "Contact store",
  settings: addressSchema.settings,
});
