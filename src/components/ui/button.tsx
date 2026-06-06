import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base: layout, type, focus ring, disabled, and a uniform tactile press
  // (translate down on active) that every solid variant inherits.
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ' +
    'ring-offset-background transition-[transform,background-color,box-shadow,filter] duration-150 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        // Solid primary with a soft drop shadow that collapses on press.
        default:
          'bg-primary text-primary-foreground shadow-[0_2px_0_0_hsl(var(--primary)/0.55),0_8px_20px_-8px_hsl(var(--primary)/0.5)] ' +
          'hover:brightness-110 active:translate-y-0.5 active:shadow-[0_1px_0_0_hsl(var(--primary)/0.55)]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/70 active:bg-secondary/80',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-secondary active:bg-secondary/80',
        ghost: 'text-foreground hover:bg-secondary active:bg-secondary/80',
        reward:
          'bg-reward text-white shadow-[0_2px_0_0_hsl(var(--reward)/0.55),0_8px_20px_-8px_hsl(var(--reward)/0.55)] ' +
          'hover:brightness-105 active:translate-y-0.5 active:shadow-[0_1px_0_0_hsl(var(--reward)/0.55)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:brightness-110',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-lg px-3.5 text-[13px]',
        lg: 'h-14 rounded-2xl px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
