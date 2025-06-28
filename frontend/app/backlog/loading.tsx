export default function Loading() {
  return (
    <div className="p-4 md:p-6 w-full animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
      </div>
      
      {/* Filters skeleton */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Task groups skeleton */}
      <div className="space-y-6">
        {[1, 2, 3].map((index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((taskIndex) => (
                <div key={taskIndex} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
