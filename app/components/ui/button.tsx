import * as React from 'react'
import { cva } from 'class-variance-authority'

import type { VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        outline:
          'border border-foreground/15 bg-transparent text-foreground hover:bg-foreground/5',
        ghost: 'text-foreground hover:bg-foreground/5',
      },
      size: {
        default: 'h-11 px-6 text-sm',
        lg: 'h-12 px-7 text-base',
        sm: 'h-9 px-4 text-sm',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
