import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40",
        secondary:
          "border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50",
        destructive:
          "border-transparent bg-red-500/20 text-red-400 shadow hover:bg-red-500/30",
        outline: "text-slate-300 border-slate-700 hover:bg-slate-800/50",
        success:
          "border-transparent bg-emerald-500/20 text-emerald-400 shadow hover:bg-emerald-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
