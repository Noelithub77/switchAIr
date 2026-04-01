import { useEffect, useState } from 'react';

import { Edit3, RefreshCw } from 'lucide-react';
import { filter } from 'lodash-es';
import { useTranslation } from 'react-i18next';

import type { OpencodeAccount } from '@/types/opencode-account';

import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OpencodeAccountCard } from '@/components/accounts/OpencodeAccountCard';
import { OpencodeImportExportDialog } from '@/components/accounts/OpencodeImportExportDialog';
import {
  useActivateOpencodeAccount,
  useExportOpencodeBundle,
  useImportOpencodeBundle,
  useOpencodeAccounts,
  useRemoveOpencodeLiveAuth,
  useSyncOpencodeAccounts,
  useUpdateOpencodeAccountNote,
} from '@/hooks/useOpencodeAccounts';

export function OpencodeAccountsPane() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: accounts, isLoading, isError, error } = useOpencodeAccounts();
  const syncMutation = useSyncOpencodeAccounts();
  const activateMutation = useActivateOpencodeAccount();
  const removeLiveMutation = useRemoveOpencodeLiveAuth();
  const updateNoteMutation = useUpdateOpencodeAccountNote();
  const exportMutation = useExportOpencodeBundle();
  const importMutation = useImportOpencodeBundle();

  const [editingAccount, setEditingAccount] = useState<OpencodeAccount | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    if (!editingAccount) {
      setNoteDraft('');
      return;
    }

    setNoteDraft(editingAccount.note || '');
  }, [editingAccount]);

  useEffect(() => {
    if (!isError || !error) {
      return;
    }

    toast({
      title: t('accountSources.opencode.loadFailedTitle'),
      description: error instanceof Error ? error.message : String(error),
      variant: 'destructive',
    });
  }, [error, isError, t, toast]);

  const totalAccounts = accounts?.length || 0;
  const liveAccounts = filter(accounts, (account) => account.isLive).length;

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-lg border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('accountSources.opencode.title')}</h2>
            <p className="text-muted-foreground">{t('accountSources.opencode.description')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="bg-muted/50 rounded-md border px-3 py-2">
              <div className="text-muted-foreground text-[11px] uppercase">
                {t('accountSources.opencode.saved')}
              </div>
              <div className="text-base font-semibold">{totalAccounts}</div>
            </div>
            <div className="bg-muted/50 rounded-md border px-3 py-2">
              <div className="text-muted-foreground text-[11px] uppercase">
                {t('accountSources.opencode.liveCount')}
              </div>
              <div className="text-base font-semibold text-emerald-600">{liveAccounts}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <Button
          variant="outline"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {t('accountSources.opencode.sync')}
        </Button>

        <OpencodeImportExportDialog
          exportPending={exportMutation.isPending}
          importPending={importMutation.isPending}
          onExport={() =>
            exportMutation.mutate(undefined, {
              onSuccess: (result) => {
                if (result.canceled) {
                  return;
                }

                toast({
                  title: t('accountSources.opencode.exportSuccessTitle'),
                  description: result.filePath || undefined,
                });
              },
              onError: (mutationError) => {
                toast({
                  title: t('accountSources.opencode.exportFailedTitle'),
                  description:
                    mutationError instanceof Error ? mutationError.message : String(mutationError),
                  variant: 'destructive',
                });
              },
            })
          }
          onImport={() =>
            importMutation.mutate(undefined, {
              onSuccess: (result) => {
                if (result.canceled) {
                  return;
                }

                toast({
                  title: t('accountSources.opencode.importSuccessTitle'),
                  description: result.filePath || undefined,
                });
              },
              onError: (mutationError) => {
                toast({
                  title: t('accountSources.opencode.importFailedTitle'),
                  description:
                    mutationError instanceof Error ? mutationError.message : String(mutationError),
                  variant: 'destructive',
                });
              },
            })
          }
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-14 text-center">
          {t('accountSources.opencode.loading')}
        </div>
      ) : totalAccounts === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-14 text-center">
          {t('accountSources.opencode.empty')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts?.map((account) => (
            <OpencodeAccountCard
              key={account.id}
              account={account}
              onUse={(accountId) =>
                activateMutation.mutate(
                  { accountId },
                  {
                    onSuccess: () => {
                      toast({
                        title: t('accountSources.opencode.activateSuccessTitle'),
                        description: t('accountSources.opencode.activateSuccessDescription'),
                      });
                    },
                    onError: (mutationError) => {
                      toast({
                        title: t('accountSources.opencode.activateFailedTitle'),
                        description:
                          mutationError instanceof Error
                            ? mutationError.message
                            : String(mutationError),
                        variant: 'destructive',
                      });
                    },
                  },
                )
              }
              onRemoveLive={(providerKey) =>
                removeLiveMutation.mutate(
                  { providerKey },
                  {
                    onSuccess: () => {
                      toast({
                        title: t('accountSources.opencode.removeLiveSuccessTitle'),
                        description: t('accountSources.opencode.removeLiveSuccessDescription'),
                      });
                    },
                    onError: (mutationError) => {
                      toast({
                        title: t('accountSources.opencode.removeLiveFailedTitle'),
                        description:
                          mutationError instanceof Error
                            ? mutationError.message
                            : String(mutationError),
                        variant: 'destructive',
                      });
                    },
                  },
                )
              }
              onEditNote={setEditingAccount}
              isActivating={
                activateMutation.isPending && activateMutation.variables?.accountId === account.id
              }
              isRemovingLive={
                removeLiveMutation.isPending &&
                removeLiveMutation.variables?.providerKey === account.providerKey
              }
            />
          ))}
        </div>
      )}

      <Dialog open={Boolean(editingAccount)} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              {t('accountSources.opencode.editNote')}
            </DialogTitle>
            <DialogDescription>{t('accountSources.opencode.editNoteDescription')}</DialogDescription>
          </DialogHeader>
          <Input value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              {t('cloud.identity.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (!editingAccount) {
                  return;
                }

                updateNoteMutation.mutate(
                  { accountId: editingAccount.id, note: noteDraft },
                  {
                    onSuccess: () => {
                      toast({
                        title: t('accountSources.opencode.noteSavedTitle'),
                        description: t('accountSources.opencode.noteSavedDescription'),
                      });
                      setEditingAccount(null);
                    },
                    onError: (mutationError) => {
                      toast({
                        title: t('accountSources.opencode.noteSaveFailedTitle'),
                        description:
                          mutationError instanceof Error
                            ? mutationError.message
                            : String(mutationError),
                        variant: 'destructive',
                      });
                    },
                  },
                );
              }}
              disabled={updateNoteMutation.isPending}
            >
              {t('settings.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
