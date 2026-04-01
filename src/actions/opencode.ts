import { ipc } from '@/ipc/manager';

import type {
  OpencodeAccount,
  OpencodeImportExportResult,
} from '@/types/opencode-account';

export function listOpencodeAccounts(): Promise<OpencodeAccount[]> {
  return ipc.client.opencode.listAccounts();
}

export function syncOpencodeAccounts(): Promise<OpencodeAccount[]> {
  return ipc.client.opencode.syncAccounts();
}

export function activateOpencodeAccount(input: { accountId: string }): Promise<void> {
  return ipc.client.opencode.activateAccount(input);
}

export function removeOpencodeLiveAuth(input: { providerKey: string }): Promise<void> {
  return ipc.client.opencode.removeLiveAuth(input);
}

export function updateOpencodeAccountNote(input: {
  accountId: string;
  note: string;
}): Promise<OpencodeAccount> {
  return ipc.client.opencode.updateAccountNote(input);
}

export function exportOpencodeBundle(): Promise<OpencodeImportExportResult> {
  return ipc.client.opencode.exportBundle();
}

export function importOpencodeBundle(): Promise<OpencodeImportExportResult> {
  return ipc.client.opencode.importBundle();
}
