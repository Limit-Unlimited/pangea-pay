"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-transparent px-3.5 py-1 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };
