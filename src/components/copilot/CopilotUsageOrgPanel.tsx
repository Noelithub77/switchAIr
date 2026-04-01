import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getOrganizationCopilotUsage } from '@/actions/copilot';
import { CopilotUsageState } from '@/components/copilot/CopilotUsageState';
import { CopilotUsageSummary } from '@/components/copilot/CopilotUsageSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CopilotOrganizationUsageSummary } from '@/types/copilot-usage';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function buildStats(summary: CopilotOrganizationUsageSummary) {
  return [
    {
      label: 'Daily Active Users',
      value: formatNumber(summary.dailyActiveUsers),
      hint: `Latest day ${summary.latestDay}`,
    },
    {
      label: 'Monthly Active Users',
      value: formatNumber(summary.monthlyActiveUsers),
      hint: `Chat ${formatNumber(summary.monthlyActiveChatUsers)} · Agent ${formatNumber(summary.monthlyActiveAgentUsers)}`,
    },
    {
      label: 'Requests',
      value: formatNumber(summary.totalRequests),
      hint: `Prompts ${formatNumber(summary.totalPrompts)} · Sessions ${formatNumber(summary.totalSessions)}`,
    },
    {
      label: 'PR Impact',
      value: formatNumber(summary.totalPullRequestsCreated),
      hint: `Merged ${formatNumber(summary.totalPullRequestsMerged)}`,
    },
  ];
}

export function CopilotUsageOrgPanel() {
  const { t } = useTranslation();
  const [org, setOrg] = useState('');
  const [token, setToken] = useState('');

  const usageMutation = useMutation({
    mutationFn: getOrganizationCopilotUsage,
  });

  const summary = usageMutation.data;

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-xl border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight">
              {t('copilot.org.title', 'Organization Copilot usage')}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t(
                'copilot.org.description',
                'Load the 28-day Copilot usage metrics report for an organization. The token stays in memory for this session only.',
              )}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              usageMutation.mutate({
                org: org.trim(),
                token: token.trim(),
              })
            }
            disabled={usageMutation.isPending || !org.trim() || !token.trim()}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${usageMutation.isPending ? 'animate-spin' : ''}`}
            />
            {t('copilot.org.load', 'Load organization report')}
          </Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="copilot-usage-org">{t('copilot.org.org', 'Organization slug')}</Label>
            <Input
              id="copilot-usage-org"
              value={org}
              onChange={(event) => setOrg(event.target.value)}
              placeholder={t('copilot.org.orgPlaceholder', 'example-org')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="copilot-usage-org-token">
              {t('copilot.org.token', 'Organization metrics token')}
            </Label>
            <Input
              id="copilot-usage-org-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder={t('copilot.org.tokenPlaceholder', 'Session only, never saved')}
            />
          </div>
        </div>

        <div className="text-muted-foreground mt-3 text-xs">
          {t(
            'copilot.org.tokenHint',
            'Use a GitHub token with organization Copilot metrics read access for the target org.',
          )}
        </div>
      </div>

      {usageMutation.isPending && !summary ? (
        <CopilotUsageState
          loading
          title={t('copilot.org.loadingTitle', 'Loading organization usage')}
          description={t(
            'copilot.org.loadingDescription',
            'Fetching the latest 28-day Copilot usage report and summarizing it for the dashboard.',
          )}
        />
      ) : null}

      {usageMutation.isError && !summary ? (
        <CopilotUsageState
          tone="error"
          title={t('copilot.org.errorTitle', 'Could not load organization usage')}
          description={
            usageMutation.error instanceof Error ? usageMutation.error.message : 'Unknown error'
          }
        />
      ) : null}

      {summary ? (
        <>
          <CopilotUsageSummary stats={buildStats(summary)} />

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="bg-card rounded-xl border">
              <div className="border-b px-5 py-4">
                <h3 className="font-semibold">
                  {t('copilot.org.featureBreakdown', 'Feature breakdown')}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t(
                    'copilot.org.featureBreakdownDescription',
                    'Top Copilot features by interaction volume across the report window.',
                  )}
                </p>
              </div>

              <div className="divide-y">
                {summary.featureBreakdown.map((feature) => (
                  <div
                    key={feature.feature}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]"
                  >
                    <div>
                      <div className="font-medium">{feature.feature}</div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {`${formatNumber(feature.linesAdded)} lines added`}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                        Interactions
                      </div>
                      <div className="mt-1 font-medium">
                        {formatNumber(feature.interactionCount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                        Generations
                      </div>
                      <div className="mt-1 font-medium">
                        {formatNumber(feature.codeGenerationCount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                        Acceptances
                      </div>
                      <div className="mt-1 font-medium">
                        {formatNumber(feature.codeAcceptanceCount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold">{t('copilot.org.reportWindow', 'Report window')}</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                    Organization
                  </div>
                  <div className="mt-1 text-lg font-semibold">{summary.org}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                    Coverage
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {`${summary.reportStartDay} to ${summary.reportEndDay}`}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                      Lines Added
                    </div>
                    <div className="mt-2 text-xl font-semibold">
                      {formatNumber(summary.totalLinesAdded)}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                      Lines Deleted
                    </div>
                    <div className="mt-2 text-xl font-semibold">
                      {formatNumber(summary.totalLinesDeleted)}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                      Code Generations
                    </div>
                    <div className="mt-2 text-xl font-semibold">
                      {formatNumber(summary.totalCodeGenerations)}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
                      Code Acceptances
                    </div>
                    <div className="mt-2 text-xl font-semibold">
                      {formatNumber(summary.totalCodeAcceptances)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
