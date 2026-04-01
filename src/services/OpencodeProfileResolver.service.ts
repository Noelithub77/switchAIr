import { createHash } from 'crypto';

import { logger } from '@/utils/logger';

import type { OpencodeAuthEntry } from '@/types/opencode-account';

interface ResolvedProfile {
  email?: string;
  name?: string;
  avatarUrl?: string;
  accountId?: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (token.split('.').length !== 3) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch (error) {
    logger.debug('Failed to decode OpenCode JWT payload', error);
    return null;
  }
}

async function fetchGithubProfile(token: string): Promise<ResolvedProfile> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'switchAIr',
    },
  });

  if (!response.ok) {
    throw new Error(`github_profile_${response.status}`);
  }

  const payload = (await response.json()) as {
    email?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    login?: string | null;
    id?: number;
  };

  return {
    email: payload.email ?? undefined,
    name: payload.name ?? payload.login ?? undefined,
    avatarUrl: payload.avatar_url ?? undefined,
    accountId: payload.id ? String(payload.id) : undefined,
  };
}

function getStringValue(
  source: Record<string, unknown> | null,
  key: string,
): string | undefined {
  if (!source) {
    return undefined;
  }

  const value = source[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getOpenAiProfileClaims(payload: Record<string, unknown> | null): ResolvedProfile {
  if (!payload) {
    return {};
  }

  const profile =
    payload['https://api.openai.com/profile'] &&
    typeof payload['https://api.openai.com/profile'] === 'object'
      ? (payload['https://api.openai.com/profile'] as Record<string, unknown>)
      : null;
  const auth =
    payload['https://api.openai.com/auth'] && typeof payload['https://api.openai.com/auth'] === 'object'
      ? (payload['https://api.openai.com/auth'] as Record<string, unknown>)
      : null;

  return {
    email: getStringValue(profile, 'email'),
    accountId:
      getStringValue(auth, 'chatgpt_account_id') ||
      getStringValue(auth, 'chatgpt_user_id') ||
      getStringValue(payload, 'sub'),
  };
}

export class OpencodeProfileResolverService {
  static buildSignature(providerKey: string, authEntry: OpencodeAuthEntry): string {
    const base = JSON.stringify({
      providerKey,
      access: authEntry.access ?? '',
      refresh: authEntry.refresh ?? '',
      accountId: authEntry.accountId ?? '',
      expires: authEntry.expires ?? null,
    });

    return createHash('sha256').update(base).digest('hex');
  }

  static async resolve(
    providerKey: string,
    authEntry: OpencodeAuthEntry,
  ): Promise<ResolvedProfile> {
    const jwtPayload = authEntry.access ? decodeJwtPayload(authEntry.access) : null;
    const email = getStringValue(jwtPayload, 'email');
    const name =
      getStringValue(jwtPayload, 'name') ||
      getStringValue(jwtPayload, 'preferred_username') ||
      getStringValue(jwtPayload, 'login');

    const localProfile: ResolvedProfile = {
      email,
      name,
      accountId: authEntry.accountId || getStringValue(jwtPayload, 'sub'),
    };

    if (providerKey === 'openai') {
      return {
        ...localProfile,
        ...getOpenAiProfileClaims(jwtPayload),
      };
    }

    if (providerKey === 'github-copilot' && authEntry.access) {
      try {
        return {
          ...localProfile,
          ...(await fetchGithubProfile(authEntry.access)),
        };
      } catch (error) {
        logger.warn('Failed to enrich GitHub Copilot account profile', error);
      }
    }

    return localProfile;
  }
}
