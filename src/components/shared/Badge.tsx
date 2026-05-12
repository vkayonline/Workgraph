import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-3 py-0.5 text-[0.8125rem] font-medium rounded-full',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
