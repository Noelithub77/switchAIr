import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, PencilLine, PlugZap, Power, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { OpencodeAccount } from '@/types/opencode-account';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface OpencodeAccountCardProps {
  account: OpencodeAccount;
  onUse: (accountId: string) => void;
  onRemoveLive: (providerKey: string) => void;
  onEditNote: (account: OpencodeAccount) => void;
  isActivating?: boolean;
  isRemovingLive?: boolean;
}

export function OpencodeAccountCard({
  account,
  onUse,
  onRemoveLive,
  onEditNote,
  isActivating,
  isRemovingLive,
}: OpencodeAccountCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        'bg-card flex h-full flex-col overflow-hidden border',
        account.isLive && 'border-emerald-500/30 bg-emerald-500/5',
      )}
    >
      <div className={cn('flex-1', account.isLive && 'blur-[1px] opacity-70')}>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          {account.avatarUrl ? (
            <img
              src={account.avatarUrl}
              alt={account.name || account.email || account.providerKey}
              className="bg-muted h-10 w-10 rounded-full border object-cover"
            />
          ) : (
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold uppercase">
              {(account.name || account.email || account.providerKey).charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">
              {account.name || account.email || t('accountSources.opencode.unknown')}
            </CardTitle>
            <CardDescription className="truncate">
              {account.email || t('accountSources.opencode.missingEmail')}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('cloud.card.actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEditNote(account)}>
                <PencilLine className="mr-2 h-4 w-4" />
                {t('accountSources.opencode.editNote')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onRemoveLive(account.providerKey)}
                disabled={!account.isLive || isRemovingLive}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('accountSources.opencode.removeLive')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{account.providerKey}</Badge>
            <Badge variant="secondary">{account.authType}</Badge>
            {account.isLive && (
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
                {t('accountSources.opencode.live')}
              </Badge>
            )}
          </div>

          {account.note && (
            <div className="bg-muted/40 rounded-lg border p-3 text-sm">
              <div className="text-muted-foreground mb-1 text-xs uppercase">
                {t('accountSources.opencode.note')}
              </div>
              <p>{account.note}</p>
            </div>
          )}

          <div className="text-muted-foreground grid gap-1 text-xs">
            <div>{t('accountSources.opencode.accountId', { value: account.accountId || '—' })}</div>
            <div>
              {t('accountSources.opencode.lastSynced', {
                value: formatDistanceToNow(account.lastSyncedAt, { addSuffix: true }),
              })}
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="bg-muted/20 flex items-center justify-between gap-2 border-t">
        <span className="text-muted-foreground text-xs">
          {t('accountSources.opencode.updated', {
            value: formatDistanceToNow(account.updatedAt, { addSuffix: true }),
          })}
        </span>
        <Button onClick={() => onUse(account.id)} disabled={isActivating || account.isLive}>
          {account.isLive ? (
            <PlugZap className="mr-2 h-4 w-4" />
          ) : (
            <Power className="mr-2 h-4 w-4" />
          )}
          {account.isLive ? t('accountSources.opencode.occupied') : t('cloud.card.use')}
        </Button>
      </CardFooter>
    </Card>
  );
}
