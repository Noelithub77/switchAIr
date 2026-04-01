import { BarChart3, Building2, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CopilotUsageOrgPanel } from '@/components/copilot/CopilotUsageOrgPanel';
import { CopilotUsagePersonalPanel } from '@/components/copilot/CopilotUsagePersonalPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CopilotUsagePage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-6xl space-y-5 p-6">
      <div className="bg-card overflow-hidden rounded-2xl border">
        <div className="bg-muted/40 border-b px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('copilot.title', 'Copilot Usage')}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
                {t(
                  'copilot.description',
                  'A GitHub-backed usage dashboard for Copilot premium requests and organization activity, styled to fit the existing switchAir control surface.',
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <Tabs defaultValue="personal" className="space-y-5">
            <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger
                value="personal"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2 text-sm"
              >
                <UserRound className="mr-2 h-4 w-4" />
                {t('copilot.personal.tab', 'Personal')}
              </TabsTrigger>
              <TabsTrigger
                value="organization"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border px-4 py-2 text-sm"
              >
                <Building2 className="mr-2 h-4 w-4" />
                {t('copilot.org.tab', 'Organization')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-0">
              <CopilotUsagePersonalPanel />
            </TabsContent>

            <TabsContent value="organization" className="mt-0">
              <CopilotUsageOrgPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
