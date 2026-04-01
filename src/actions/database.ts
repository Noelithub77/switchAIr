import { ipc } from '@/ipc/manager';
import {
  AccountBackupData,
  Account,
  AntigravityImportExportResult,
} from '@/types/account';

export function backupAccount(account: Account) {
  return ipc.client.database.backupAccount(account);
}

export function restoreAccount(backup: AccountBackupData) {
  return ipc.client.database.restoreAccount(backup);
}

export function getCurrentAccountInfo() {
  return ipc.client.database.getCurrentAccountInfo();
}

export function exportCurrentAccountBundle(): Promise<AntigravityImportExportResult> {
  return ipc.client.database.exportCurrentAccountBundle();
}

export function importAccountBundle(): Promise<AntigravityImportExportResult> {
  return ipc.client.database.importAccountBundle();
}
