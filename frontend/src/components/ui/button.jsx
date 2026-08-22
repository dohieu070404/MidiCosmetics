import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[0.76rem] font-semibold uppercase tracking-[0.09em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border border-primary bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-md',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-secondary/70 hover:text-foreground',
        outline:
          'border border-foreground/35 bg-background/70 hover:-translate-y-0.5 hover:border-primary hover:bg-secondary/60 hover:text-primary',
        luxury:
          'border border-primary/20 bg-card text-foreground shadow-sm hover:border-primary/40 hover:bg-primary hover:text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-4 text-[0.72rem]',
        lg: 'h-12 px-7 text-[0.8rem]',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
});

Button.displayName = 'Button';

export { Button, buttonVariants };
