export default function Loading() {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar skeleton */}
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex-shrink-0">
          <div className="h-9 bg-surface-container-highest rounded-shape-full animate-pulse" />
        </div>

        {/* Results bar skeleton */}
        <div className="px-5 py-2 border-b border-outline-variant bg-surface-container-low flex items-center gap-3 flex-shrink-0">
          <div className="h-4 w-20 bg-surface-container-highest rounded animate-pulse" />
          <div className="h-5 w-14 bg-surface-container-highest rounded-shape-full animate-pulse" />
        </div>

        {/* Column headers skeleton — desktop only */}
        <div className="hidden md:flex items-center gap-3 px-5 py-3 border-b border-outline-variant bg-surface-container-low flex-shrink-0">
          <div className="w-2 flex-shrink-0" />
          <div className="h-3 w-10 bg-surface-container-highest rounded animate-pulse" style={{ width: 260 }} />
          <div className="h-3 w-16 bg-surface-container-highest rounded animate-pulse" style={{ width: 200 }} />
          <div className="flex-1" />
          <div className="h-3 bg-surface-container-highest rounded animate-pulse" style={{ width: 120 }} />
          <div className="h-3 bg-surface-container-highest rounded animate-pulse" style={{ width: 48 }} />
        </div>

        {/* Row skeletons */}
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 h-10 border-b border-outline-variant"
              style={{ opacity: 1 - i * 0.045 }}
            >
              <div className="w-2 h-2 rounded-full bg-surface-container-highest animate-pulse flex-shrink-0" />
              <div
                className="h-4 bg-surface-container-highest rounded animate-pulse flex-shrink-0"
                style={{ width: 160 + (i % 5) * 22 }}
              />
              <div
                className="h-4 bg-surface-container-highest rounded animate-pulse flex-shrink-0 hidden md:block"
                style={{ width: 90 + (i % 4) * 18 }}
              />
              <div className="flex-1" />
              <div
                className="h-6 bg-surface-container-highest rounded-shape-sm animate-pulse flex-shrink-0 hidden md:block"
                style={{ width: 80 + (i % 3) * 12 }}
              />
              <div className="h-4 w-8 bg-surface-container-highest rounded animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
