import { useEffect, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { sumBy } from 'lodash-es';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getPersonalCopilotUsage } from '@/actions/copilot';
import { CopilotUsageState } from '@/components/copilot/CopilotUsageState';
import { CopilotUsageSummary } from '@/components/copilot/CopilotUsageSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CopilotPersonalUsageSummary } from '@/types/copilot-usage';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function buildStats(summary: CopilotPersonalUsageSummary) {
  const modelCount = summary.usageItems.length;

  return [
    {
      label: 'Account',
      value: summary.username,
      hint:
        summary.source === 'live-auth' ? 'Using live github-copilot auth' : 'Using manual token',
    },
    {
      label: 'Net Requests',
      value: formatNumber(summary.totalNetQuantity),
      hint: `Gross ${formatNumber(summary.totalGrossQuantity)}`,
    },
    {
      label: 'Estimated Cost',
      value: formatCurrency(summary.totalNetAmount),
      hint: `Gross ${formatCurrency(summary.totalGrossAmount)}`,
    },
    {
      label: 'Models',
      value: formatNumber(modelCount),
      hint: summary.timePeriodLabel,
    },
  ];
}

export function CopilotUsagePersonalPanel() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [manualToken, setManualToken] = useState('');

  const usageMutation = useMutation({
    mutationFn: getPersonalCopilotUsage,
  });

  useEffect(() => {
    usageMutation.mutate({});
    // Run once to make the dashboard useful immediately when live auth exists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = usageMutation.data;
  const totalModels = summary ? sumBy(summary.usageItems, () => 1) : 0;

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-xl border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight">
              {t('copilot.personal.title', 'Personal Copilot usage')}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t(
                'copilot.personal.description',
                'Load GitHub Copilot premium request usage for the live github-copilot account, or override it with a manual token for billing access.',
              )}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              usageMutation.mutate({
                username: username.trim() || undefined,
                token: manualToken.trim() || undefined,
              })
            }
            disabled={usageMutation.isPending}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${usageMutation.isPending ? 'animate-spin' : ''}`}
            />
            {t('copilot.personal.reload', 'Reload usage')}
          </Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="copilot-usage-username">
              {t('copilot.personal.username', 'GitHub username override')}
            </Label>
            <Input
              id="copilot-usage-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t(
                'copilot.personal.usernamePlaceholder',
                'Optional if the token resolves /user',
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="copilot-usage-token">
              {t('copilot.personal.token', 'Manual token override')}
            </Label>
            <Input
              id="copilot-usage-token"
              type="password"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder={t('copilot.personal.tokenPlaceholder', 'Session only, never saved')}
            />
          </div>
        </div>

        <div className="text-muted-foreground mt-3 text-xs">
          {t(
            'copilot.personal.tokenHint',
            'If the live token does not have billing access, use a GitHub token that can read personal plan billing usage.',
          )}
        </div>
      </div>

      {usageMutation.isPending && !summary ? (
        <CopilotUsageState
          loading
          title={t('copilot.personal.loadingTitle', 'Loading Copilot usage')}
          description={t(
            'copilot.personal.loadingDescription',
            'Fetching premium request billing data from GitHub.',
          )}
        />
      ) : null}

      {usageMutation.isError && !summary ? (
        <CopilotUsageState
          tone="error"
          title={t('copilot.personal.errorTitle', 'Could not load personal usage')}
          description={
            usageMutation.error instanceof Error ? usageMutation.error.message : 'Unknown error'
          }
        />
      ) : null}

      {summary ? (
        <>
          <CopilotUsageSummary stats={buildStats(summary)} />

          <div className="bg-card rounded-xl border">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="font-semibold">
                  {t('copilot.personal.breakdown', 'Model breakdown')}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t('copilot.personal.breakdownDescription', 'Premium requests grouped by model')}
                </p>
              </div>
              <div className="text-muted-foreground text-xs">{`${formatNumber(totalModels)} entries`}</div>
            </div>

            <div className="divide-y">
              {summary.usageItems.map((item) => (
                <div
                  key={`${item.model}-${item.sku}`}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]"
                >
                  <div>
                    <div className="font-medium">{item.model}</div>
                    <div className="text-muted-foreground mt-1 text-xs">{item.sku}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                      Net
                    </div>
                    <div className="mt-1 font-medium">{formatNumber(item.netQuantity)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                      Cost
                    </div>
                    <div className="mt-1 font-medium">{formatCurrency(item.netAmount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                      Unit Price
                    </div>
                    <div className="mt-1 font-medium">{formatCurrency(item.pricePerUnit)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
