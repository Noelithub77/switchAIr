import fs from 'fs';
import path from 'path';

import { parse, stringify } from 'comment-json';
import { v4 as uuidv4 } from 'uuid';

import { decrypt, encrypt } from '@/utils/security';
import {
  getOpencodeAuthFilePath,
  getOpencodeDataDir,
  getOpencodeSwitchAirFilePath,
} from '@/utils/paths';
import { logger } from '@/utils/logger';

import {
  OpencodeAccount,
  OpencodeAuthEntry,
  OpencodeExportAccount,
  OpencodeExportBundle,
  OpencodeSwitchAirDocumentSchema,
  StoredOpencodeAccount,
} from '@/types/opencode-account';
import { OpencodeProfileResolverService } from '@/services/OpencodeProfileResolver.service';

const SWITCH_AIR_SCHEMA_VERSION = 1;

type CommentToken = {
  type: 'LineComment';
  value: string;
  inline: false;
};

function ensureDirectoryExists(filePath: string): void {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeAuthEntry(value: unknown): OpencodeAuthEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = typeof value.type === 'string' ? value.type : 'oauth';
  return {
    type,
    ...value,
  };
}

async function decryptPayload(account: StoredOpencodeAccount): Promise<OpencodeAuthEntry> {
  const decrypted = await decrypt(account.encryptedPayload);
  return normalizeAuthEntry(JSON.parse(decrypted)) ?? { type: account.authType };
}

function toSummaryComment(account: StoredOpencodeAccount): CommentToken[] {
  const pieces = [
    ` provider=${account.providerKey}`,
    ` email=${account.email || 'unknown'}`,
    ` name=${account.name || 'unknown'}`,
  ];

  return [
    {
      type: 'LineComment',
      value: pieces.join(' |'),
      inline: false,
    },
  ];
}

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export class OpencodeAccountStoreService {
  static async readAuthFile(): Promise<Record<string, OpencodeAuthEntry>> {
    const filePath = getOpencodeAuthFilePath();
    const text = await readTextFile(filePath);
    if (!text) {
      return {};
    }

    const parsed = JSON.parse(text) as Record<string, unknown>;
    const entries: Record<string, OpencodeAuthEntry> = {};
    for (const [providerKey, value] of Object.entries(parsed)) {
      const normalized = normalizeAuthEntry(value);
      if (normalized) {
        entries[providerKey] = normalized;
      }
    }
    return entries;
  }

  static async writeAuthFile(entries: Record<string, OpencodeAuthEntry>): Promise<void> {
    const filePath = getOpencodeAuthFilePath();
    ensureDirectoryExists(filePath);
    await fs.promises.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf8');
  }

  static async readStoredAccounts(): Promise<StoredOpencodeAccount[]> {
    const filePath = getOpencodeSwitchAirFilePath();
    const text = await readTextFile(filePath);
    if (!text) {
      return [];
    }

    const parsed = parse(text, undefined, true);
    const document = OpencodeSwitchAirDocumentSchema.parse(parsed);
    return document.accounts;
  }

  static async writeStoredAccounts(accounts: StoredOpencodeAccount[]): Promise<void> {
    const filePath = getOpencodeSwitchAirFilePath();
    ensureDirectoryExists(filePath);

    const document = parse(
      `{
  "schemaVersion": ${SWITCH_AIR_SCHEMA_VERSION},
  "updatedAt": "",
  "accounts": []
}
`,
    ) as Record<string, unknown>;

    const commentableDocument = document as Record<symbol, CommentToken[]> & Record<string, unknown>;
    commentableDocument[Symbol.for('before-all')] = [
      {
        type: 'LineComment',
        value: ' switchAIr OpenCode inventory. Live file stores encrypted auth payloads.',
        inline: false,
      },
      {
        type: 'LineComment',
        value: ' Exported bundles contain raw auth tokens. Treat them like secrets.',
        inline: false,
      },
    ];

    document.updatedAt = new Date().toISOString();
    document.accounts = accounts.map((account) => ({
      id: account.id,
      providerKey: account.providerKey,
      authType: account.authType,
      email: account.email,
      name: account.name,
      avatarUrl: account.avatarUrl,
      accountId: account.accountId,
      note: account.note,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      lastSyncedAt: account.lastSyncedAt,
      lastActivatedAt: account.lastActivatedAt,
      archived: account.archived ?? false,
      encryptedPayload: account.encryptedPayload,
    }));

    const accountsArray = document.accounts as unknown as Array<StoredOpencodeAccount> &
      Record<symbol, CommentToken[]>;
    accounts.forEach((account, index) => {
      accountsArray[Symbol.for(`before:${index}`)] = toSummaryComment(account);
    });

    await fs.promises.writeFile(filePath, stringify(document, null, 2), 'utf8');
  }

  static async listAccounts(): Promise<OpencodeAccount[]> {
    await this.syncFromAuthFile();

    const storedAccounts = await this.readStoredAccounts();
    const liveEntries = await this.readAuthFile();
    const liveSignatures = new Map(
      Object.entries(liveEntries).map(([providerKey, authEntry]) => [
        providerKey,
        OpencodeProfileResolverService.buildSignature(providerKey, authEntry),
      ]),
    );

    const publicAccounts = await Promise.all(
      storedAccounts
        .filter((account) => !account.archived)
        .map(async (account) => {
          const payload = await decryptPayload(account);
          const signature = OpencodeProfileResolverService.buildSignature(
            account.providerKey,
            payload,
          );

          return {
            id: account.id,
            providerKey: account.providerKey,
            authType: account.authType,
            email: account.email,
            name: account.name,
            avatarUrl: account.avatarUrl,
            accountId: account.accountId,
            note: account.note,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
            lastSyncedAt: account.lastSyncedAt,
            lastActivatedAt: account.lastActivatedAt,
            isLive: liveSignatures.get(account.providerKey) === signature,
          } satisfies OpencodeAccount;
        }),
    );

    return publicAccounts.sort((left, right) => {
      if (left.isLive !== right.isLive) {
        return left.isLive ? -1 : 1;
      }

      return right.updatedAt - left.updatedAt;
    });
  }

  static async syncFromAuthFile(): Promise<void> {
    ensureDirectoryExists(path.join(getOpencodeDataDir(), 'noop'));

    const liveEntries = await this.readAuthFile();
    const storedAccounts = await this.readStoredAccounts();
    const nextAccounts = [...storedAccounts];

    for (const [providerKey, authEntry] of Object.entries(liveEntries)) {
      const profile = await OpencodeProfileResolverService.resolve(providerKey, authEntry);
      const encryptedPayload = await encrypt(JSON.stringify(authEntry));
      const now = Date.now();
      const existingIndex = await this.findMatchingAccountIndex(nextAccounts, providerKey, {
        authEntry,
        email: profile.email,
        accountId: profile.accountId || authEntry.accountId,
      });

      if (existingIndex >= 0) {
        const existing = nextAccounts[existingIndex];
        nextAccounts[existingIndex] = {
          ...existing,
          authType: authEntry.type,
          email: profile.email || existing.email,
          name: profile.name || existing.name,
          avatarUrl: profile.avatarUrl || existing.avatarUrl,
          accountId: profile.accountId || authEntry.accountId || existing.accountId,
          lastSyncedAt: now,
          updatedAt: now,
          archived: false,
          encryptedPayload,
        };
        continue;
      }

      nextAccounts.push({
        id: uuidv4(),
        providerKey,
        authType: authEntry.type,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        accountId: profile.accountId || authEntry.accountId,
        note: '',
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: now,
        archived: false,
        encryptedPayload,
      });
    }

    await this.writeStoredAccounts(nextAccounts);
  }

  static async activateAccount(accountId: string): Promise<void> {
    const storedAccounts = await this.readStoredAccounts();
    const account = storedAccounts.find((candidate) => candidate.id === accountId && !candidate.archived);
    if (!account) {
      throw new Error(`OpenCode account not found: ${accountId}`);
    }

    const payload = await decryptPayload(account);
    const liveEntries = await this.readAuthFile();
    liveEntries[account.providerKey] = payload;
    await this.writeAuthFile(liveEntries);

    const now = Date.now();
    account.lastActivatedAt = now;
    account.updatedAt = now;
    await this.writeStoredAccounts(storedAccounts);
  }

  static async removeLiveProviderAuth(providerKey: string): Promise<void> {
    const liveEntries = await this.readAuthFile();
    delete liveEntries[providerKey];
    await this.writeAuthFile(liveEntries);
  }

  static async updateAccountMetadata(accountId: string, note: string): Promise<OpencodeAccount> {
    const storedAccounts = await this.readStoredAccounts();
    const account = storedAccounts.find((candidate) => candidate.id === accountId);
    if (!account) {
      throw new Error(`OpenCode account not found: ${accountId}`);
    }

    account.note = note;
    account.updatedAt = Date.now();
    await this.writeStoredAccounts(storedAccounts);

    const [updated] = (await this.listAccounts()).filter((candidate) => candidate.id === accountId);
    return updated;
  }

  static async getExportBundle(): Promise<OpencodeExportBundle> {
    const storedAccounts = await this.readStoredAccounts();
    const accounts = await Promise.all(
      storedAccounts
        .filter((account) => !account.archived)
        .map(async (account) => ({
          id: account.id,
          providerKey: account.providerKey,
          authType: account.authType,
          email: account.email,
          name: account.name,
          avatarUrl: account.avatarUrl,
          accountId: account.accountId,
          note: account.note,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          lastSyncedAt: account.lastSyncedAt,
          lastActivatedAt: account.lastActivatedAt,
          auth: await decryptPayload(account),
        }) satisfies OpencodeExportAccount),
    );

    return {
      kind: 'switchair-opencode',
      version: '1',
      exportedAt: new Date().toISOString(),
      accounts,
    };
  }

  static async importExportBundle(bundle: OpencodeExportBundle): Promise<number> {
    const storedAccounts = await this.readStoredAccounts();
    const nextAccounts = [...storedAccounts];

    for (const account of bundle.accounts) {
      const encryptedPayload = await encrypt(JSON.stringify(account.auth));
      const existingIndex = await this.findMatchingAccountIndex(nextAccounts, account.providerKey, {
        authEntry: account.auth,
        email: account.email,
        accountId: account.accountId,
      });

      if (existingIndex >= 0) {
        const existing = nextAccounts[existingIndex];
        nextAccounts[existingIndex] = {
          ...existing,
          authType: account.authType,
          email: account.email || existing.email,
          name: account.name || existing.name,
          avatarUrl: account.avatarUrl || existing.avatarUrl,
          accountId: account.accountId || existing.accountId,
          note: account.note || existing.note,
          createdAt: existing.createdAt,
          updatedAt: Date.now(),
          lastSyncedAt: account.lastSyncedAt || Date.now(),
          lastActivatedAt: account.lastActivatedAt,
          archived: false,
          encryptedPayload,
        };
        continue;
      }

      nextAccounts.push({
        id: account.id || uuidv4(),
        providerKey: account.providerKey,
        authType: account.authType,
        email: account.email,
        name: account.name,
        avatarUrl: account.avatarUrl,
        accountId: account.accountId,
        note: account.note,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        lastSyncedAt: account.lastSyncedAt,
        lastActivatedAt: account.lastActivatedAt,
        archived: false,
        encryptedPayload,
      });
    }

    await this.writeStoredAccounts(nextAccounts);
    return bundle.accounts.length;
  }

  private static async findMatchingAccountIndex(
    accounts: StoredOpencodeAccount[],
    providerKey: string,
    match: {
      authEntry: OpencodeAuthEntry;
      email?: string;
      accountId?: string;
    },
  ): Promise<number> {
    const targetSignature = OpencodeProfileResolverService.buildSignature(providerKey, match.authEntry);

    for (const [index, account] of accounts.entries()) {
      if (account.providerKey !== providerKey) {
        continue;
      }

      if (match.accountId && account.accountId && match.accountId === account.accountId) {
        return index;
      }

      if (
        match.email &&
        account.email &&
        match.email.toLowerCase() === account.email.toLowerCase()
      ) {
        return index;
      }

      try {
        const payload = await decryptPayload(account);
        const savedSignature = OpencodeProfileResolverService.buildSignature(providerKey, payload);
        if (savedSignature === targetSignature) {
          return index;
        }
      } catch (error) {
        logger.warn(`Failed to decrypt OpenCode payload for ${account.id} during matching`, error);
      }
    }

    return -1;
  }
}
