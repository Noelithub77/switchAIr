import { describe, it, expect, vi } from 'vitest';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  const existsSync = vi.fn((value: unknown) => value === '/usr/share/antigravity/antigravity');

  return {
    ...actual,
    default: {
      ...actual,
      existsSync,
    },
    existsSync,
  };
});

import {
  getAppDataDir,
  getAntigravityDbPath,
  getAntigravityStoragePath,
  getAntigravityExecutablePath,
  getOpencodeAuthFilePath,
  getOpencodeDataDir,
  getOpencodeSwitchAirFilePath,
} from '../../utils/paths';

describe('Path Utilities', () => {
  it('should get correct AppData directory', () => {
    const appData = getAppDataDir();
    expect(appData).toBeDefined();
    expect(appData.length).toBeGreaterThan(0);
  });

  it('should get correct DB path', () => {
    const dbPath = getAntigravityDbPath();
    expect(dbPath).toContain('state.vscdb');
  });

  it('should get correct storage path', () => {
    const storagePath = getAntigravityStoragePath();
    expect(storagePath).toContain('storage.json');
  });

  it('should get correct executable path', () => {
    const execPath = getAntigravityExecutablePath();
    if (process.platform === 'linux') {
      expect(execPath).toBe('/usr/share/antigravity/antigravity');
    } else if (process.platform === 'darwin') {
      expect(execPath).toBe('/Applications/Antigravity.app/Contents/MacOS/Antigravity');
    }
    // Windows path depends on env vars, harder to test strictly without mocking
  });

  it('should resolve the OpenCode data directory', () => {
    const dataDir = getOpencodeDataDir();
    expect(dataDir).toContain('opencode');
  });

  it('should resolve the OpenCode auth file path', () => {
    expect(getOpencodeAuthFilePath()).toContain('auth.json');
  });

  it('should resolve the OpenCode switchAIr inventory path', () => {
    expect(getOpencodeSwitchAirFilePath()).toContain('switchAIr.jsonc');
  });
});
