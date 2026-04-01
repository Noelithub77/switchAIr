import { useEffect, useMemo, useState } from 'react';

import { Edit3, Plus, RefreshCw } from 'lucide-react';
import { filter, find, uniqBy } from 'lodash-es';
import { useTranslation } from 'react-i18next';

import type { OpencodeAccount } from '@/types/opencode-account';

import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [selectedProviderKey, setSelectedProviderKey] = useState('');
  const [nextStepPrompt, setNextStepPrompt] = useState<string | null>(null);
  const [selectedProviderTab, setSelectedProviderTab] = useState('');

  const getProviderLabel = (providerKey: string): string => {
    if (providerKey === 'github-copilot') {
      return t('accountSources.opencode.providers.github');
    }

    if (providerKey === 'openai') {
      return t('accountSources.opencode.providers.openai');
    }

    return providerKey;
  };

  const totalAccounts = accounts?.length || 0;
  const liveAccounts = filter(accounts, (account) => account.isLive).length;
  const liveProviders = uniqBy(filter(accounts, (account) => account.isLive), 'providerKey');
  const selectedProvider = find(
    liveProviders,
    (account) => account.providerKey === selectedProviderKey,
  );
  const providerTabs = useMemo(() => {
    const providers = uniqBy(accounts ?? [], 'providerKey');
    const preferredOrder = ['github-copilot', 'openai'];
    const orderedProviders = [
      ...preferredOrder
        .map((providerKey) => providers.find((account) => account.providerKey === providerKey))
        .filter((account): account is OpencodeAccount => Boolean(account)),
      ...providers.filter((account) => !preferredOrder.includes(account.providerKey)),
    ];

    return orderedProviders;
  }, [accounts]);
  const visibleLiveAccounts = filter(
    accounts,
    (account) => account.providerKey === selectedProviderTab && account.isLive,
  ).length;

  useEffect(() => {
    if (!editingAccount) {
      setNoteDraft('');
      return;
    }

    setNoteDraft(editingAccount.note || '');
  }, [editingAccount]);

  useEffect(() => {
    if (!newAccountOpen) {
      setSelectedProviderKey('');
      return;
    }

    const fallbackProvider =
      liveProviders.find((account) => account.providerKey === selectedProviderTab)?.providerKey ||
      liveProviders[0]?.providerKey ||
      selectedProviderTab ||
      accounts?.[0]?.providerKey ||
      '';
    setSelectedProviderKey(fallbackProvider);
  }, [accounts, liveProviders, newAccountOpen, selectedProviderTab]);

  useEffect(() => {
    if (!providerTabs.length) {
      setSelectedProviderTab('');
      return;
    }

    if (providerTabs.some((account) => account.providerKey === selectedProviderTab)) {
      return;
    }

    setSelectedProviderTab(providerTabs[0].providerKey);
  }, [providerTabs, selectedProviderTab]);

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

      <Tabs value={selectedProviderTab} onValueChange={setSelectedProviderTab} className="space-y-5">
        <TabsList className="h-auto flex flex-wrap justify-start gap-2 bg-transparent p-0">
          {providerTabs.map((account) => (
            <TabsTrigger
              key={account.providerKey}
              value={account.providerKey}
              className="rounded-full border px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {getProviderLabel(account.providerKey)}
              <span className="text-muted-foreground ml-2 text-xs">
                {filter(accounts, (candidate) => candidate.providerKey === account.providerKey).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="bg-card flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {t('accountSources.opencode.sync')}
          </Button>

          <Button
            variant="outline"
            onClick={() => setNewAccountOpen(true)}
            disabled={visibleLiveAccounts === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('accountSources.opencode.newAccount')}
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

        {nextStepPrompt && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <div className="font-semibold text-amber-700 dark:text-amber-300">
              {t('accountSources.opencode.nextStepTitle')}
            </div>
            <div className="text-muted-foreground mt-1">{nextStepPrompt}</div>
          </div>
        )}

        {isLoading ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-14 text-center">
            {t('accountSources.opencode.loading')}
          </div>
        ) : totalAccounts === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-14 text-center">
            {t('accountSources.opencode.empty')}
          </div>
        ) : !selectedProviderTab ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-14 text-center">
            {t('accountSources.opencode.empty')}
          </div>
        ) : (
          providerTabs.map((provider) => (
            <TabsContent key={provider.providerKey} value={provider.providerKey} className="mt-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {t('accountSources.opencode.providerTabDescription', {
                    provider: getProviderLabel(provider.providerKey),
                    count: filter(accounts, (account) => account.providerKey === provider.providerKey)
                      .length,
                    liveCount: filter(
                      accounts,
                      (account) => account.providerKey === provider.providerKey && account.isLive,
                    ).length,
                  })}
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
                {filter(accounts, (account) => account.providerKey === provider.providerKey).map(
                  (account) => (
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
                        activateMutation.isPending &&
                        activateMutation.variables?.accountId === account.id
                      }
                      isRemovingLive={
                        removeLiveMutation.isPending &&
                        removeLiveMutation.variables?.providerKey === account.providerKey
                      }
                    />
                  ),
                )}
              </div>
            </TabsContent>
          ))
        )}
      </Tabs>

      <Dialog open={newAccountOpen} onOpenChange={setNewAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('accountSources.opencode.newAccountDialogTitle')}</DialogTitle>
            <DialogDescription>{t('accountSources.opencode.newAccountDialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="opencode-provider-select">{t('accountSources.opencode.provider')}</Label>
            <Select value={selectedProviderKey} onValueChange={setSelectedProviderKey}>
              <SelectTrigger id="opencode-provider-select">
                <SelectValue placeholder={t('accountSources.opencode.providerPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {liveProviders
                  .filter((account) => account.providerKey === selectedProviderTab)
                  .map((account) => (
                    <SelectItem key={account.providerKey} value={account.providerKey}>
                      {account.providerKey}
                      {account.email ? ` · ${account.email}` : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedProvider && (
              <p className="text-muted-foreground text-sm">
                {t('accountSources.opencode.newAccountDialogHint', {
                  provider: selectedProvider.providerKey,
                  email: selectedProvider.email || t('accountSources.opencode.missingEmail'),
                })}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAccountOpen(false)}>
              {t('cloud.identity.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (!selectedProviderKey) {
                  return;
                }

                removeLiveMutation.mutate(
                  { providerKey: selectedProviderKey },
                  {
                    onSuccess: () => {
                      setNewAccountOpen(false);
                      setNextStepPrompt(
                        t('accountSources.opencode.nextStepMessage', {
                          provider: selectedProvider?.providerKey || selectedProviderKey,
                        }),
                      );
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
                );
              }}
              disabled={removeLiveMutation.isPending || !selectedProviderKey}
            >
              {t('accountSources.opencode.clearSlot')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
