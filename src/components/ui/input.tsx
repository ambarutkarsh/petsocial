import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[16px] border-[1.5px] border-border bg-surface-alt px-[18px] py-[14px] text-[15px] font-body text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-hint focus-visible:outline-none focus-visible:border-primary focus-visible:bg-card focus-visible:shadow-[0_0_0_4px_rgba(45,74,62,0.1)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
