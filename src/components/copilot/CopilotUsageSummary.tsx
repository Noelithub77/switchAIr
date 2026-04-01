interface CopilotUsageStat {
  label: string;
  value: string;
  hint?: string;
}

interface CopilotUsageSummaryProps {
  stats: CopilotUsageStat[];
}

export function CopilotUsageSummary({ stats }: CopilotUsageSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card rounded-xl border p-4">
          <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
            {stat.label}
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight">{stat.value}</div>
          {stat.hint ? <div className="text-muted-foreground mt-2 text-xs">{stat.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
