import { maxBy, orderBy, sumBy } from 'lodash-es';

import { OpencodeAccountStoreService } from '@/services/OpencodeAccountStore.service';
import type {
  CopilotFeatureUsageSummary,
  CopilotOrgUsageInput,
  CopilotOrganizationUsageSummary,
  CopilotPersonalUsageInput,
  CopilotPersonalUsageSummary,
  CopilotPremiumUsageItem,
} from '@/types/copilot-usage';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';
const USER_AGENT = 'switchAir';
const LIVE_GITHUB_PROVIDER_KEY = 'github-copilot';

interface GitHubApiErrorPayload {
  message?: string;
}

interface GitHubViewer {
  login?: string;
}

interface BillingUsageTimePeriod {
  year: number;
  month?: number;
  day?: number;
}

interface BillingUsageResponse {
  timePeriod: BillingUsageTimePeriod;
  usageItems: CopilotPremiumUsageItem[];
}

interface UsageReportReference {
  download_links: string[];
  report_start_day: string;
  report_end_day: string;
}

interface UsageDayRecord {
  day: string;
  daily_active_users?: number;
  monthly_active_users?: number;
  monthly_active_chat_users?: number;
  monthly_active_agent_users?: number;
  total_pull_requests_created?: number;
  total_pull_requests_merged?: number;
  totals_by_cli?: {
    request_count?: number;
    prompt_count?: number;
    session_count?: number;
  };
  totals_by_feature?: Array<{
    feature?: string;
    user_initiated_interaction_count?: number;
    code_generation_activity_count?: number;
    code_acceptance_activity_count?: number;
    loc_added_sum?: number;
    loc_deleted_sum?: number;
  }>;
}

function createHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': USER_AGENT,
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  };
}

async function requestGitHubJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    headers: createHeaders(token),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as GitHubApiErrorPayload | null;
    const message = payload?.message || response.statusText;
    throw new Error(`GitHub API ${response.status}: ${message}`);
  }

  return (await response.json()) as T;
}

async function requestJsonFromUrl<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Report download failed with status ${response.status}`);
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('The Copilot usage report was empty.');
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const lines = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line)) as T;
    return lines;
  }
}

function formatTimePeriodLabel(timePeriod: BillingUsageTimePeriod): string {
  if (timePeriod.day && timePeriod.month) {
    return `${timePeriod.year}-${String(timePeriod.month).padStart(2, '0')}-${String(timePeriod.day).padStart(2, '0')}`;
  }

  if (timePeriod.month) {
    return `${timePeriod.year}-${String(timePeriod.month).padStart(2, '0')}`;
  }

  return String(timePeriod.year);
}

function normalizeUsageDays(payload: unknown): UsageDayRecord[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const candidate = entry as Record<string, unknown>;
    if (Array.isArray(candidate.day_totals)) {
      return candidate.day_totals as UsageDayRecord[];
    }

    if (typeof candidate.day === 'string') {
      return [candidate as unknown as UsageDayRecord];
    }

    return [];
  });
}

async function resolvePersonalAuth(input: CopilotPersonalUsageInput): Promise<{
  source: CopilotPersonalUsageSummary['source'];
  token: string;
  username: string;
}> {
  if (input.token) {
    const viewer = await requestGitHubJson<GitHubViewer>('/user', input.token);
    if (!input.username && !viewer.login) {
      throw new Error('Could not determine the GitHub username for the provided token.');
    }

    return {
      source: 'manual-token',
      token: input.token,
      username: input.username || viewer.login || '',
    };
  }

  const liveEntries = await OpencodeAccountStoreService.readAuthFile();
  const liveGitHubAuth = liveEntries[LIVE_GITHUB_PROVIDER_KEY];
  if (!liveGitHubAuth?.access) {
    throw new Error(
      'No live GitHub Copilot auth was found. Add a manual token or sync a live github-copilot account first.',
    );
  }

  const viewer = await requestGitHubJson<GitHubViewer>('/user', liveGitHubAuth.access);
  if (!viewer.login) {
    throw new Error('Could not determine the live GitHub Copilot username.');
  }

  return {
    source: 'live-auth',
    token: liveGitHubAuth.access,
    username: input.username || viewer.login,
  };
}

function buildBillingUsagePath(username: string, input: CopilotPersonalUsageInput): string {
  const params = new URLSearchParams();
  if (input.year) {
    params.set('year', String(input.year));
  }
  if (input.month) {
    params.set('month', String(input.month));
  }
  if (input.day) {
    params.set('day', String(input.day));
  }

  const query = params.toString();
  const basePath = `/users/${encodeURIComponent(username)}/settings/billing/usage/items`;
  return query ? `${basePath}?${query}` : basePath;
}

function summarizeFeatureBreakdown(dayRecords: UsageDayRecord[]): CopilotFeatureUsageSummary[] {
  const features = new Map<string, CopilotFeatureUsageSummary>();

  dayRecords.forEach((record) => {
    record.totals_by_feature?.forEach((feature) => {
      const key = feature.feature || 'unknown';
      const existing = features.get(key) || {
        feature: key,
        interactionCount: 0,
        codeGenerationCount: 0,
        codeAcceptanceCount: 0,
        linesAdded: 0,
      };

      existing.interactionCount += feature.user_initiated_interaction_count || 0;
      existing.codeGenerationCount += feature.code_generation_activity_count || 0;
      existing.codeAcceptanceCount += feature.code_acceptance_activity_count || 0;
      existing.linesAdded += feature.loc_added_sum || 0;
      features.set(key, existing);
    });
  });

  return orderBy(
    Array.from(features.values()),
    ['interactionCount', 'codeGenerationCount', 'linesAdded'],
    ['desc', 'desc', 'desc'],
  ).slice(0, 6);
}

export class CopilotUsageService {
  static async getPersonalUsageSummary(
    input: CopilotPersonalUsageInput,
  ): Promise<CopilotPersonalUsageSummary> {
    const auth = await resolvePersonalAuth(input);
    const usage = await requestGitHubJson<BillingUsageResponse>(
      buildBillingUsagePath(auth.username, input),
      auth.token,
    );
    const usageItems = orderBy(usage.usageItems, ['netQuantity', 'netAmount'], ['desc', 'desc']);

    return {
      source: auth.source,
      username: auth.username,
      timePeriodLabel: formatTimePeriodLabel(usage.timePeriod),
      totalNetQuantity: sumBy(usageItems, 'netQuantity'),
      totalNetAmount: sumBy(usageItems, 'netAmount'),
      totalGrossQuantity: sumBy(usageItems, 'grossQuantity'),
      totalGrossAmount: sumBy(usageItems, 'grossAmount'),
      usageItems,
    };
  }

  static async getOrganizationUsageSummary(
    input: CopilotOrgUsageInput,
  ): Promise<CopilotOrganizationUsageSummary> {
    const reportReference = await requestGitHubJson<UsageReportReference>(
      `/orgs/${encodeURIComponent(input.org)}/copilot/metrics/reports/organization-28-day/latest`,
      input.token,
    );

    const reportUrl = reportReference.download_links[0];
    if (!reportUrl) {
      throw new Error('GitHub returned no report download links for this organization.');
    }

    const reportPayload = await requestJsonFromUrl<unknown>(reportUrl);
    const dayRecords = normalizeUsageDays(reportPayload);
    if (dayRecords.length === 0) {
      throw new Error('The organization report did not include any daily metrics.');
    }

    const latestDay = maxBy(dayRecords, (record) => record.day);
    if (!latestDay) {
      throw new Error('Could not determine the latest metrics day from the organization report.');
    }

    return {
      org: input.org,
      reportStartDay: reportReference.report_start_day,
      reportEndDay: reportReference.report_end_day,
      latestDay: latestDay.day,
      dailyActiveUsers: latestDay.daily_active_users || 0,
      monthlyActiveUsers: latestDay.monthly_active_users || 0,
      monthlyActiveChatUsers: latestDay.monthly_active_chat_users || 0,
      monthlyActiveAgentUsers: latestDay.monthly_active_agent_users || 0,
      totalRequests: sumBy(dayRecords, (record) => record.totals_by_cli?.request_count || 0),
      totalPrompts: sumBy(dayRecords, (record) => record.totals_by_cli?.prompt_count || 0),
      totalSessions: sumBy(dayRecords, (record) => record.totals_by_cli?.session_count || 0),
      totalLinesAdded: sumBy(dayRecords, (record) =>
        sumBy(record.totals_by_feature || [], (feature) => feature.loc_added_sum || 0),
      ),
      totalLinesDeleted: sumBy(dayRecords, (record) =>
        sumBy(record.totals_by_feature || [], (feature) => feature.loc_deleted_sum || 0),
      ),
      totalCodeGenerations: sumBy(dayRecords, (record) =>
        sumBy(
          record.totals_by_feature || [],
          (feature) => feature.code_generation_activity_count || 0,
        ),
      ),
      totalCodeAcceptances: sumBy(dayRecords, (record) =>
        sumBy(
          record.totals_by_feature || [],
          (feature) => feature.code_acceptance_activity_count || 0,
        ),
      ),
      totalPullRequestsCreated: sumBy(
        dayRecords,
        (record) => record.total_pull_requests_created || 0,
      ),
      totalPullRequestsMerged: sumBy(
        dayRecords,
        (record) => record.total_pull_requests_merged || 0,
      ),
      featureBreakdown: summarizeFeatureBreakdown(dayRecords),
    };
  }
}
