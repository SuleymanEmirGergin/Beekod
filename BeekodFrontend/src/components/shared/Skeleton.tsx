interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Skeleton({
    className = '',
    width,
    height,
    rounded = 'md'
}: SkeletonProps) {
    const roundedClasses = {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
    };

    return (
        <div
            className={`skeleton ${roundedClasses[rounded]} ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
            }}
        />
    );
}

// Pre-built skeleton variants
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height={16}
                    width={i === lines - 1 ? '60%' : '100%'}
                />
            ))}
        </div>
    );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/40 dark:border-gray-700/40 p-6 ${className}`}>
            <div className="flex items-center gap-4 mb-4">
                <Skeleton width={48} height={48} rounded="xl" />
                <div className="flex-1">
                    <Skeleton height={20} width="60%" className="mb-2" />
                    <Skeleton height={14} width="40%" />
                </div>
            </div>
            <SkeletonText lines={2} />
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/40 dark:border-gray-700/40 overflow-hidden">
            {/* Header */}
            <div className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} height={16} width={100} className="flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <Skeleton key={colIndex} height={20} className="flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}
