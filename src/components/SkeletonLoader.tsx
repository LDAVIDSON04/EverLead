export function SkeletonBox({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} style={style} />
  );
}

export function SkeletonText({ width = "100%" }: { width?: string }) {
  return (
    <SkeletonBox className="h-4" style={{ width }} />
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-64" />
        <SkeletonBox className="h-4 w-96" />
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonBox key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

