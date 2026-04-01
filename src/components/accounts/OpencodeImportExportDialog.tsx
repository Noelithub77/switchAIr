import { useState } from 'react';

import { AlertTriangle, Download, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface OpencodeImportExportDialogProps {
  exportPending: boolean;
  importPending: boolean;
  onExport: () => void;
  onImport: () => void;
}

export function OpencodeImportExportDialog({
  exportPending,
  importPending,
  onExport,
  onImport,
}: OpencodeImportExportDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('accountSources.opencode.export')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('accountSources.opencode.exportWarningTitle')}</DialogTitle>
            <DialogDescription>
              {t('accountSources.opencode.exportWarningDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-start gap-3 rounded-lg border border-amber-500/20 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('accountSources.opencode.exportWarningHint')}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('cloud.identity.cancel')}
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                onExport();
              }}
              disabled={exportPending}
            >
              {t('accountSources.opencode.exportConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="outline" onClick={onImport} disabled={importPending}>
        <Upload className="mr-2 h-4 w-4" />
        {t('accountSources.opencode.import')}
      </Button>
    </div>
  );
}
