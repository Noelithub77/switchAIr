import {
  OpencodeAccount,
  OpencodeImportExportResult,
} from '@/types/opencode-account';

import { OpencodeAccountStoreService } from '@/services/OpencodeAccountStore.service';
import { OpencodeImportExportService } from '@/services/OpencodeImportExport.service';

export async function listOpencodeAccounts(): Promise<OpencodeAccount[]> {
  return OpencodeAccountStoreService.listAccounts();
}

export async function syncOpencodeAccounts(): Promise<OpencodeAccount[]> {
  await OpencodeAccountStoreService.syncFromAuthFile();
  return OpencodeAccountStoreService.listAccounts();
}

export async function activateOpencodeAccount(accountId: string): Promise<void> {
  await OpencodeAccountStoreService.activateAccount(accountId);
}

export async function removeOpencodeLiveAuth(providerKey: string): Promise<void> {
  await OpencodeAccountStoreService.removeLiveProviderAuth(providerKey);
}

export async function updateOpencodeAccountNote(
  accountId: string,
  note: string,
): Promise<OpencodeAccount> {
  return OpencodeAccountStoreService.updateAccountMetadata(accountId, note);
}

export async function exportOpencodeBundle(): Promise<OpencodeImportExportResult> {
  return OpencodeImportExportService.exportBundle();
}

export async function importOpencodeBundle(): Promise<OpencodeImportExportResult> {
  return OpencodeImportExportService.importBundle();
}
