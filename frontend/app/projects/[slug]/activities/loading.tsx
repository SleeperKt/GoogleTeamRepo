export default function ActivityLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-9 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Activity Feed Skeleton */}
        <div className="space-y-6">
          {[...Array(3)].map((_, dayIndex) => (
            <div key={dayIndex}>
              {/* Date Header Skeleton */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="flex-1 h-px bg-gray-200"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>

              {/* Activities Card Skeleton */}
              <div className="bg-white dark:bg-gray-800 border rounded-lg">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {[...Array(4)].map((_, activityIndex) => (
                    <div key={activityIndex} className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon Skeleton */}
                        <div className="w-4 h-4 bg-gray-200 rounded mt-1"></div>
                        
                        {/* Content Skeleton */}
                        <div className="flex-1 space-y-2">
                          {/* Actor and action line */}
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                          
                          {/* Details skeleton */}
                          <div className="h-3 bg-gray-200 rounded w-64"></div>
                          
                          {/* Timestamp skeleton */}
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button Skeleton */}
        <div className="text-center pt-6">
          <div className="h-10 bg-gray-200 rounded w-40 mx-auto"></div>
        </div>
      </div>
    </div>
  )
} 