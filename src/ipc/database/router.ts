import { z } from 'zod';
import { os } from '@orpc/server';
import { backupAccount, restoreAccount, getCurrentAccountInfo } from './handler';
import {
  AccountBackupDataSchema,
  AccountInfoSchema,
  AccountSchema,
  AntigravityImportExportResultSchema,
} from '../../types/account';
import { AntigravityImportExportService } from '@/services/AntigravityImportExport.service';

export const databaseRouter = os.router({
  backupAccount: os
    .input(AccountSchema)
    .output(AccountBackupDataSchema)
    .handler(async ({ input }) => {
      return backupAccount(input);
    }),

  restoreAccount: os
    .input(AccountBackupDataSchema)
    .output(z.void())
    .handler(async ({ input }) => {
      restoreAccount(input);
    }),

  getCurrentAccountInfo: os.output(AccountInfoSchema).handler(async () => {
    return getCurrentAccountInfo();
  }),

  exportCurrentAccountBundle: os
    .output(AntigravityImportExportResultSchema)
    .handler(async () => {
      return AntigravityImportExportService.exportBundle();
    }),

  importAccountBundle: os.output(AntigravityImportExportResultSchema).handler(async () => {
    return AntigravityImportExportService.importBundle();
  }),
});
