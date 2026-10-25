/**
 * Horizontal ranked bars for "top N" breakdowns.
 * items: [{ label, count }]
 */
const BarList = ({ title, icon: Icon, items = [], emptyText = "No data yet" }) => {
  const max = Math.max(1, ...items.map((i) => Number(i.count)));
  const total = items.reduce((sum, i) => sum + Number(i.count), 0) || 1;

  return (
    <div className="stat-tile !p-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {title}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 py-3">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.slice(0, 6).map((item) => {
            const count = Number(item.count);
            const pct = Math.round((count / total) * 100);
            return (
              <li key={item.label ?? "unknown"}>
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="truncate text-zinc-700 dark:text-zinc-200 font-medium">{item.label || "Unknown"}</span>
                  <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
                    {count.toLocaleString()} <span className="text-zinc-400 dark:text-zinc-500">· {pct}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-accent-100 dark:bg-accent-900/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400 transition-[width] duration-500"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BarList;
