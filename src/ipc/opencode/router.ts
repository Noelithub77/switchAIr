import { os } from '@orpc/server';
import { z } from 'zod';

import {
  activateOpencodeAccount,
  exportOpencodeBundle,
  importOpencodeBundle,
  listOpencodeAccounts,
  removeOpencodeLiveAuth,
  syncOpencodeAccounts,
  updateOpencodeAccountNote,
} from '@/ipc/opencode/handler';
import {
  OpencodeAccountSchema,
  OpencodeImportExportResultSchema,
} from '@/types/opencode-account';

export const opencodeRouter = os.router({
  listAccounts: os.output(z.array(OpencodeAccountSchema)).handler(async () => {
    return listOpencodeAccounts();
  }),

  syncAccounts: os.output(z.array(OpencodeAccountSchema)).handler(async () => {
    return syncOpencodeAccounts();
  }),

  activateAccount: os
    .input(z.object({ accountId: z.string() }))
    .output(z.void())
    .handler(async ({ input }) => {
      await activateOpencodeAccount(input.accountId);
    }),

  removeLiveAuth: os
    .input(z.object({ providerKey: z.string() }))
    .output(z.void())
    .handler(async ({ input }) => {
      await removeOpencodeLiveAuth(input.providerKey);
    }),

  updateAccountNote: os
    .input(z.object({ accountId: z.string(), note: z.string() }))
    .output(OpencodeAccountSchema)
    .handler(async ({ input }) => {
      return updateOpencodeAccountNote(input.accountId, input.note);
    }),

  exportBundle: os.output(OpencodeImportExportResultSchema).handler(async () => {
    return exportOpencodeBundle();
  }),

  importBundle: os.output(OpencodeImportExportResultSchema).handler(async () => {
    return importOpencodeBundle();
  }),
});
