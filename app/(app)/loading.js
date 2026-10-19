export default function AppLoading() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Loading workspace content"
    >
      {/* Header Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c2536] pb-4">
        <div className="space-y-2">
          <div className="h-7 w-36 sm:w-48 bg-slate-800/80 rounded-md" />
          <div className="h-4 w-56 sm:w-72 bg-slate-800/50 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-[38px] w-24 bg-slate-800/80 rounded-md" />
          <div className="h-[38px] w-20 bg-slate-800/60 rounded-md" />
        </div>
      </div>

      {/* Search and Filters Bar Skeleton */}
      <div className="flex flex-col gap-3 bg-[#111624] border border-[#1c2536] rounded-lg p-3 sm:p-4">
        <div className="h-10 w-full bg-slate-800/60 rounded-md border border-[#1c2536]" />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="h-7 w-16 bg-slate-800/60 rounded-md" />
          <div className="h-7 w-20 bg-slate-800/60 rounded-md" />
          <div className="h-7 w-20 bg-slate-800/60 rounded-md" />
          <div className="h-7 w-16 bg-slate-800/60 rounded-md" />
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-[#1e293b]/80 bg-gradient-to-b from-[#131b2c] to-[#0d1320] p-5 shadow-md space-y-4"
          >
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-4 w-3/4 bg-slate-800/80 rounded" />
                  <div className="h-3 w-1/3 bg-slate-800/50 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-3.5 w-full bg-slate-800/60 rounded" />
                <div className="h-3.5 w-4/5 bg-slate-800/50 rounded" />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <div className="h-5 w-14 bg-slate-800/60 rounded-md" />
                <div className="h-5 w-16 bg-slate-800/60 rounded-md" />
                <div className="h-5 w-12 bg-slate-800/60 rounded-md" />
              </div>
            </div>
            <div className="pt-3 border-t border-[#1c2536]/80 flex items-center justify-between">
              <div className="h-3.5 w-20 bg-slate-800/50 rounded" />
              <div className="h-3.5 w-16 bg-slate-800/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
