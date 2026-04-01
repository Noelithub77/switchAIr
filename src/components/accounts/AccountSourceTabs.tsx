import { useTranslation } from 'react-i18next';

import { AntigravityAccountsPane } from '@/components/accounts/AntigravityAccountsPane';
import { OpencodeAccountsPane } from '@/components/accounts/OpencodeAccountsPane';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type AccountSource, useAccountSourceStore } from '@/store/account-source.store';

export function AccountSourceTabs() {
  const { t } = useTranslation();
  const selectedSource = useAccountSourceStore((state) => state.selectedSource);
  const setSelectedSource = useAccountSourceStore((state) => state.setSelectedSource);

  return (
    <Tabs value={selectedSource} onValueChange={(value) => setSelectedSource(value as AccountSource)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('nav.accounts')}</h1>
          <p className="text-muted-foreground text-sm">{t('accountSources.description')}</p>
        </div>
        <TabsList>
          <TabsTrigger value="antigravity" data-testid="account-source-antigravity">
            {t('accountSources.antigravity.tab')}
          </TabsTrigger>
          <TabsTrigger value="opencode" data-testid="account-source-opencode">
            {t('accountSources.opencode.tab')}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="antigravity">
        <AntigravityAccountsPane />
      </TabsContent>
      <TabsContent value="opencode">
        <OpencodeAccountsPane />
      </TabsContent>
    </Tabs>
  );
}
