export function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonText({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${width} animate-pulse`} />;
}

export function SkeletonChart() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}
