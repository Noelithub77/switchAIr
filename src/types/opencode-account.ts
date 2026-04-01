import { z } from 'zod';

export interface OpencodeAuthEntry {
  type: string;
  access?: string;
  refresh?: string;
  expires?: number;
  accountId?: string;
  [key: string]: unknown;
}

export interface OpencodeAccount {
  id: string;
  providerKey: string;
  authType: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  accountId?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
  lastSyncedAt: number;
  lastActivatedAt?: number;
  isLive: boolean;
}

export interface StoredOpencodeAccount {
  id: string;
  providerKey: string;
  authType: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  accountId?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
  lastSyncedAt: number;
  lastActivatedAt?: number;
  archived?: boolean;
  encryptedPayload: string;
}

export interface OpencodeSwitchAirDocument {
  schemaVersion: number;
  updatedAt: string;
  accounts: StoredOpencodeAccount[];
}

export interface OpencodeExportAccount {
  id: string;
  providerKey: string;
  authType: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  accountId?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
  lastSyncedAt: number;
  lastActivatedAt?: number;
  auth: OpencodeAuthEntry;
}

export interface OpencodeExportBundle {
  kind: 'switchair-opencode';
  version: string;
  exportedAt: string;
  accounts: OpencodeExportAccount[];
}

export interface OpencodeImportExportResult {
  canceled: boolean;
  filePath: string | null;
  accountCount?: number;
}

export const OpencodeAuthEntrySchema = z
  .object({
    type: z.string(),
    access: z.string().optional(),
    refresh: z.string().optional(),
    expires: z.number().optional(),
    accountId: z.string().optional(),
  })
  .catchall(z.unknown());

export const OpencodeAccountSchema = z.object({
  id: z.string(),
  providerKey: z.string(),
  authType: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
  accountId: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  lastSyncedAt: z.number(),
  lastActivatedAt: z.number().optional(),
  isLive: z.boolean(),
});

export const StoredOpencodeAccountSchema = z.object({
  id: z.string(),
  providerKey: z.string(),
  authType: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
  accountId: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  lastSyncedAt: z.number(),
  lastActivatedAt: z.number().optional(),
  archived: z.boolean().optional(),
  encryptedPayload: z.string(),
});

export const OpencodeSwitchAirDocumentSchema = z.object({
  schemaVersion: z.number(),
  updatedAt: z.string(),
  accounts: z.array(StoredOpencodeAccountSchema),
});

export const OpencodeExportAccountSchema = z.object({
  id: z.string(),
  providerKey: z.string(),
  authType: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
  accountId: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  lastSyncedAt: z.number(),
  lastActivatedAt: z.number().optional(),
  auth: OpencodeAuthEntrySchema,
});

export const OpencodeExportBundleSchema = z.object({
  kind: z.literal('switchair-opencode'),
  version: z.string(),
  exportedAt: z.string(),
  accounts: z.array(OpencodeExportAccountSchema),
});

export const OpencodeImportExportResultSchema = z.object({
  canceled: z.boolean(),
  filePath: z.string().nullable(),
  accountCount: z.number().optional(),
});
