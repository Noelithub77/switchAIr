import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { exportCurrentAccountBundle, importAccountBundle } from '@/actions/database';
import { AntigravityImportExportDialog } from '@/components/accounts/AntigravityImportExportDialog';
import { CloudAccountList } from '@/components/CloudAccountList';
import { useToast } from '@/components/ui/use-toast';

export function AntigravityAccountsPane() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: exportCurrentAccountBundle,
    onSuccess: (result) => {
      if (result.canceled) {
        return;
      }

      toast({
        title: t('accountSources.antigravity.exportSuccessTitle'),
        description: result.filePath || undefined,
      });
    },
    onError: (error) => {
      toast({
        title: t('accountSources.antigravity.exportFailedTitle'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: importAccountBundle,
    onSuccess: (result) => {
      if (result.canceled) {
        return;
      }

      toast({
        title: t('accountSources.antigravity.importSuccessTitle'),
        description: result.filePath || undefined,
      });
    },
    onError: (error) => {
      toast({
        title: t('accountSources.antigravity.importFailedTitle'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-card flex items-center justify-between rounded-lg border p-4">
        <div>
          <h3 className="text-lg font-semibold">{t('accountSources.antigravity.title')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('accountSources.antigravity.description')}
          </p>
        </div>
        <AntigravityImportExportDialog
          exportPending={exportMutation.isPending}
          importPending={importMutation.isPending}
          onExport={() => exportMutation.mutate()}
          onImport={() => importMutation.mutate()}
        />
      </div>

      <CloudAccountList />
    </div>
  );
}
