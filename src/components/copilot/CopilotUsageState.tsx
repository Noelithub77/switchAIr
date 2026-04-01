import { AlertCircle, Loader2 } from 'lucide-react';

interface CopilotUsageStateProps {
  title: string;
  description: string;
  tone?: 'default' | 'error';
  loading?: boolean;
}

export function CopilotUsageState({
  title,
  description,
  tone = 'default',
  loading = false,
}: CopilotUsageStateProps) {
  return (
    <div className="bg-card flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
          tone === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'
        }`}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        )}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-xl text-sm">{description}</p>
    </div>
  );
}
