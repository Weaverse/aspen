import { CaretDownIcon } from "@phosphor-icons/react";
import * as Select from "@radix-ui/react-select";

interface QuantityProps {
  value: number;
  onChange: (value: number) => void;
  maxQuantity?: number; // Optional max quantity limit
}

export function Quantity(props: QuantityProps) {
  const { value, onChange, maxQuantity = 10 } = props;

  // Generate options for the select dropdown
  const quantityOptions = Array.from({ length: maxQuantity }, (_, i) => i + 1);

  return (
    <div
      className="flex items-center justify-between border-line-subtle border-b pb-3"
      data-motion="fade-up"
    >
      <legend className="font-normal uppercase leading-tight">QTY</legend>
      <div className="w-fit">
        <Select.Root
          value={value.toString()}
          onValueChange={(v) => onChange(Number(v))}
        >
          <Select.Trigger
            className="inline-flex min-w-[60px] items-center justify-between gap-2 bg-white px-3 py-2 outline-hidden"
            aria-label="Select quantity"
          >
            <Select.Value />
            <Select.Icon className="shrink-0">
              <CaretDownIcon size={12} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 overflow-hidden rounded bg-white shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)]">
              <Select.Viewport className="p-1">
                {quantityOptions.map((quantity) => (
                  <Select.Item
                    key={quantity}
                    value={quantity.toString()}
                    className="flex h-8 w-full cursor-pointer select-none items-center justify-center rounded px-3 py-1 outline-hidden hover:bg-gray-100"
                  >
                    <Select.ItemText>{quantity}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
    </div>
  );
}
