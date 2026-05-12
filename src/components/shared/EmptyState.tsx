import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  cta?: ReactNode;
}

export function EmptyState({ message, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
      {cta}
    </div>
  );
}
