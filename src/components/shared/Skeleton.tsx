interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={['skeleton', className].join(' ')} aria-hidden />;
}

export function SkeletonCard() {
  return (
    <div className="p-6 border border-border rounded-md">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
