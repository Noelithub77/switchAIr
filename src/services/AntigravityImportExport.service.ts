import fs from 'fs';
import path from 'path';

import { parse, stringify } from 'comment-json';
import { dialog } from 'electron';

import { ipcContext } from '@/ipc/context';
import {
  AntigravityExportBundle,
  AntigravityExportBundleSchema,
  AntigravityImportExportResult,
  Account,
} from '@/types/account';
import { getAppDataDir } from '@/utils/paths';

import { backupAccount, getCurrentAccountInfo, restoreAccount } from '@/ipc/database/handler';

function buildExportFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `switchAIr-antigravity-${timestamp}.jsonc`;
}

function buildJsoncText(bundle: AntigravityExportBundle): string {
  const document = parse(JSON.stringify(bundle, null, 2)) as unknown as Record<string, unknown> &
    Record<symbol, unknown>;
  document[Symbol.for('before-all')] = [
    {
      type: 'LineComment',
      value: ' switchAIr Antigravity export. This file contains full authentication state.',
      inline: false,
    },
  ];
  return stringify(document, null, 2);
}

function buildCurrentAccount(): Account {
  const info = getCurrentAccountInfo();
  if (!info.isAuthenticated || !info.email) {
    throw new Error('No authenticated Antigravity account found to export.');
  }

  const now = new Date().toISOString();
  return {
    id: info.email,
    name: info.name || info.email,
    email: info.email,
    created_at: now,
    last_used: now,
  };
}

export class AntigravityImportExportService {
  static async exportBundle(): Promise<AntigravityImportExportResult> {
    const saveOptions = {
      title: 'Export Antigravity Account',
      defaultPath: path.join(getAppDataDir(), buildExportFileName()),
      filters: [{ name: 'JSONC Files', extensions: ['jsonc'] }],
    };
    const saveResult = ipcContext.mainWindow
      ? await dialog.showSaveDialog(ipcContext.mainWindow, saveOptions)
      : await dialog.showSaveDialog(saveOptions);

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true, filePath: null };
    }

    const bundle: AntigravityExportBundle = {
      kind: 'switchair-antigravity',
      version: '1',
      exportedAt: new Date().toISOString(),
      backup: backupAccount(buildCurrentAccount()),
    };

    await fs.promises.writeFile(saveResult.filePath, buildJsoncText(bundle), 'utf8');
    return { canceled: false, filePath: saveResult.filePath };
  }

  static async importBundle(): Promise<AntigravityImportExportResult> {
    const openOptions = {
      title: 'Import Antigravity Account',
      properties: ['openFile'] as Array<'openFile'>,
      filters: [{ name: 'JSONC Files', extensions: ['jsonc', 'json'] }],
    };
    const openResult = ipcContext.mainWindow
      ? await dialog.showOpenDialog(ipcContext.mainWindow, openOptions)
      : await dialog.showOpenDialog(openOptions);

    if (openResult.canceled || openResult.filePaths.length === 0) {
      return { canceled: true, filePath: null };
    }

    const filePath = openResult.filePaths[0];
    const text = await fs.promises.readFile(filePath, 'utf8');
    const parsed = parse(text, undefined, true);
    const bundle = AntigravityExportBundleSchema.parse(parsed);

    restoreAccount(bundle.backup);

    return { canceled: false, filePath };
  }
}
