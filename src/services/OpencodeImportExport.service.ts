import fs from 'fs';
import path from 'path';

import { parse, stringify } from 'comment-json';
import { dialog } from 'electron';

import { ipcContext } from '@/ipc/context';
import {
  OpencodeExportBundleSchema,
  OpencodeImportExportResult,
} from '@/types/opencode-account';
import { getOpencodeDataDir } from '@/utils/paths';

import { OpencodeAccountStoreService } from '@/services/OpencodeAccountStore.service';

function buildExportFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `switchAIr-opencode-${timestamp}.jsonc`;
}

function buildJsoncText(bundle: unknown): string {
  const document = parse(JSON.stringify(bundle, null, 2)) as unknown as Record<string, unknown> &
    Record<symbol, unknown>;
  document[Symbol.for('before-all')] = [
    {
      type: 'LineComment',
      value: ' switchAIr OpenCode export. This file contains full auth tokens.',
      inline: false,
    },
  ];
  return stringify(document, null, 2);
}

export class OpencodeImportExportService {
  static async exportBundle(): Promise<OpencodeImportExportResult> {
    const saveOptions = {
      title: 'Export OpenCode Accounts',
      defaultPath: path.join(getOpencodeDataDir(), buildExportFileName()),
      filters: [{ name: 'JSONC Files', extensions: ['jsonc'] }],
    };
    const saveResult = ipcContext.mainWindow
      ? await dialog.showSaveDialog(ipcContext.mainWindow, saveOptions)
      : await dialog.showSaveDialog(saveOptions);

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true, filePath: null };
    }

    const bundle = await OpencodeAccountStoreService.getExportBundle();
    await fs.promises.writeFile(saveResult.filePath, buildJsoncText(bundle), 'utf8');

    return {
      canceled: false,
      filePath: saveResult.filePath,
      accountCount: bundle.accounts.length,
    };
  }

  static async importBundle(): Promise<OpencodeImportExportResult> {
    const openOptions = {
      title: 'Import OpenCode Accounts',
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
    const bundle = OpencodeExportBundleSchema.parse(parsed);
    const accountCount = await OpencodeAccountStoreService.importExportBundle(bundle);

    return {
      canceled: false,
      filePath,
      accountCount,
    };
  }
}
