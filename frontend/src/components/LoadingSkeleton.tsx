export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        
        {/* Table */}
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            ))}
          </div>
          
          {/* Data Rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex gap-4">
              {[1, 2, 3, 4].map((col) => (
                <div key={col} className="h-4 bg-gray-100 dark:bg-gray-800 rounded flex-1"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-8 bg-gray-400 dark:bg-gray-600 rounded w-16"></div>
        </div>
        <div className="w-10 h-10 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
}

export function HistoryItemSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="flex gap-4">
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-24"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20"></div>
          </div>
        </div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  readonly variant?: 'card' | 'table' | 'stat' | 'history';
  readonly count?: number;
}

export default function LoadingSkeleton({ variant = 'card', count = 1 }: LoadingSkeletonProps) {
  const components = {
    card: CardSkeleton,
    table: TableSkeleton,
    stat: StatCardSkeleton,
    history: HistoryItemSkeleton,
  };

  const Component = components[variant];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={`skeleton-${variant}-${i}`} />
      ))}
    </>
  );
}
