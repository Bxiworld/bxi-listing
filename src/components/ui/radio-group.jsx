import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (<RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />);
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[#CBD5E1] text-[#C64091] shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C64091]/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[#C64091]",
        className
      )}
      {...props}>
      <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
        <span className="block h-2 w-2 rounded-full bg-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
