import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--color-primary),white_25%)]',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--color-secondary),black_10%)]',
  ghost:
    'bg-transparent text-foreground hover:bg-accent',
  danger:
    'bg-danger text-danger-foreground hover:bg-[color-mix(in_srgb,var(--color-danger),black_15%)]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1 text-[0.8125rem]',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium rounded-md',
        'transition-[background-color,transform] duration-[120ms]',
        'active:translate-x-px active:translate-y-px',
        'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}
