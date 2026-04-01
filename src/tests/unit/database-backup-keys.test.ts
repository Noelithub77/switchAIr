import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as handler from '../../ipc/database/handler';
import { OpencodeAccountStoreService } from '../../services/OpencodeAccountStore.service';

let writes: Record<string, string> = {};
const tempRoot = path.join(process.cwd(), 'temp_opencode_tests');
const tempAuthFilePath = path.join(tempRoot, 'auth.json');
const tempSwitchAirFilePath = path.join(tempRoot, 'switchAIr.jsonc');
interface MockOrm {
  insert: () => {
    values: (values: { key: string; value: string }) => {
      onConflictDoUpdate: () => { run: () => { changes: number } };
    };
  };
  transaction: (fn: (tx: MockOrm) => void) => void;
}

let mockOrm: MockOrm;

vi.mock('../../ipc/database/dbConnection', () => ({
  openDrizzleConnection: () => ({
    raw: { close: vi.fn() },
    orm: mockOrm,
  }),
}));

vi.mock('../../utils/paths', () => ({
  getAntigravityDbPaths: () => ['mock-db'],
  getOpencodeDataDir: () => tempRoot,
  getOpencodeAuthFilePath: () => tempAuthFilePath,
  getOpencodeSwitchAirFilePath: () => tempSwitchAirFilePath,
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../utils/security', () => ({
  encrypt: vi.fn(async (value: string) => `enc:${value}`),
  decrypt: vi.fn(async (value: string) => value.replace(/^enc:/, '')),
}));

function createJwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64url')
      .replace(/=/g, '');
  return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('database backup keys', () => {
  beforeEach(() => {
    writes = {};
    mockOrm = {
      insert: () => ({
        values: (values: { key: string; value: string }) => ({
          onConflictDoUpdate: () => ({
            run: () => {
              writes[values.key] = values.value;
              return { changes: 1 };
            },
          }),
        }),
      }),
      transaction: (fn: (tx: typeof mockOrm) => void) => {
        fn(mockOrm);
      },
    };
    vi.spyOn(fs, 'existsSync').mockImplementation((value) => {
      const pathValue = String(value);
      return !pathValue.endsWith('.backup');
    });
    fs.rmSync(tempRoot, { recursive: true, force: true });
    fs.mkdirSync(tempRoot, { recursive: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('should restore unified oauth token key', () => {
    handler.restoreAccount({
      version: '1.0',
      account: {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      },
      data: {
        antigravityAuthStatus: '{"email":"test@example.com"}',
        'jetskiStateSync.agentManagerInitState': 'old',
        'antigravityUnifiedStateSync.oauthToken': 'unified',
      },
    });

    expect(writes['antigravityUnifiedStateSync.oauthToken']).toBe('unified');
  });
});

describe('OpenCode account store service', () => {
  beforeEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    fs.mkdirSync(tempRoot, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('syncs live auth.json entries into switchAIr inventory', async () => {
    const openAiAccessToken = createJwt({
      sub: 'user-123',
      'https://api.openai.com/profile': {
        email: 'sync@example.com',
      },
      'https://api.openai.com/auth': {
        chatgpt_account_id: 'acct_123',
      },
    });

    fs.writeFileSync(
      tempAuthFilePath,
      JSON.stringify(
        {
          openai: {
            type: 'oauth',
            access: openAiAccessToken,
            refresh: 'refresh-token',
            expires: Date.now() + 60_000,
            accountId: 'acct_123',
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    await OpencodeAccountStoreService.syncFromAuthFile();
    const accounts = await OpencodeAccountStoreService.listAccounts();
    const inventoryText = fs.readFileSync(tempSwitchAirFilePath, 'utf8');

    expect(accounts).toHaveLength(1);
    expect(accounts[0].email).toBe('sync@example.com');
    expect(accounts[0].accountId).toBe('acct_123');
    expect(accounts[0].isLive).toBe(true);
    expect(inventoryText).toContain('switchAIr OpenCode inventory');
    expect(inventoryText).toContain('enc:');
  });

  it('activates saved OpenCode auth and removes live auth without deleting history', async () => {
    const openAiAccessToken = createJwt({
      sub: 'user-456',
      'https://api.openai.com/profile': {
        email: 'restore@example.com',
      },
      'https://api.openai.com/auth': {
        chatgpt_account_id: 'acct_456',
      },
    });

    fs.writeFileSync(
      tempAuthFilePath,
      JSON.stringify(
        {
          openai: {
            type: 'oauth',
            access: openAiAccessToken,
            refresh: 'refresh-token',
            expires: Date.now() + 60_000,
            accountId: 'acct_456',
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    await OpencodeAccountStoreService.syncFromAuthFile();
    fs.writeFileSync(tempAuthFilePath, JSON.stringify({}, null, 2), 'utf8');

    const [account] = await OpencodeAccountStoreService.listAccounts();
    await OpencodeAccountStoreService.activateAccount(account.id);

    const activatedAuth = JSON.parse(fs.readFileSync(tempAuthFilePath, 'utf8')) as Record<
      string,
      { accountId?: string }
    >;
    expect(activatedAuth.openai.accountId).toBe('acct_456');

    await OpencodeAccountStoreService.removeLiveProviderAuth('openai');

    const clearedAuth = JSON.parse(fs.readFileSync(tempAuthFilePath, 'utf8')) as Record<
      string,
      unknown
    >;
    const accountsAfterRemoval = await OpencodeAccountStoreService.listAccounts();

    expect(clearedAuth.openai).toBeUndefined();
    expect(accountsAfterRemoval).toHaveLength(1);
    expect(accountsAfterRemoval[0].isLive).toBe(false);
  });
});
