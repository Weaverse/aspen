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
    <div className="flex justify-between items-center border-b border-line-subtle pb-3" data-motion="fade-up">
      <legend className="font-normal leading-tight uppercase">QTY</legend>
      <div className="w-fit">
        <Select.Root
          value={value.toString()}
          onValueChange={(v) => onChange(Number(v))}
        >
          <Select.Trigger
            className="inline-flex items-center justify-between gap-2 bg-white outline-hidden px-3 py-2 min-w-[60px]"
            aria-label="Select quantity"
          >
            <Select.Value />
            <Select.Icon className="shrink-0">
              <CaretDownIcon size={12} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white rounded shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)] z-50">
              <Select.Viewport className="p-1">
                {quantityOptions.map((quantity) => (
                  <Select.Item
                    key={quantity}
                    value={quantity.toString()}
                    className="flex items-center justify-center cursor-pointer w-full hover:bg-gray-100 outline-hidden h-8 select-none px-3 py-1 rounded"
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
