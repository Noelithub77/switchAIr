import { z } from 'zod';

export const CopilotPremiumUsageItemSchema = z.object({
  product: z.string(),
  sku: z.string(),
  model: z.string(),
  unitType: z.string(),
  pricePerUnit: z.number(),
  grossQuantity: z.number(),
  grossAmount: z.number(),
  discountQuantity: z.number(),
  discountAmount: z.number(),
  netQuantity: z.number(),
  netAmount: z.number(),
});

export const CopilotPersonalUsageInputSchema = z.object({
  username: z.string().trim().optional(),
  token: z.string().trim().optional(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  day: z.number().int().min(1).max(31).optional(),
});

export const CopilotPersonalUsageSummarySchema = z.object({
  source: z.enum(['live-auth', 'manual-token']),
  username: z.string(),
  timePeriodLabel: z.string(),
  totalNetQuantity: z.number(),
  totalNetAmount: z.number(),
  totalGrossQuantity: z.number(),
  totalGrossAmount: z.number(),
  usageItems: z.array(CopilotPremiumUsageItemSchema),
});

export const CopilotOrgUsageInputSchema = z.object({
  org: z.string().trim().min(1),
  token: z.string().trim().min(1),
});

export const CopilotFeatureUsageSummarySchema = z.object({
  feature: z.string(),
  interactionCount: z.number(),
  codeGenerationCount: z.number(),
  codeAcceptanceCount: z.number(),
  linesAdded: z.number(),
});

export const CopilotOrganizationUsageSummarySchema = z.object({
  org: z.string(),
  reportStartDay: z.string(),
  reportEndDay: z.string(),
  latestDay: z.string(),
  dailyActiveUsers: z.number(),
  monthlyActiveUsers: z.number(),
  monthlyActiveChatUsers: z.number(),
  monthlyActiveAgentUsers: z.number(),
  totalRequests: z.number(),
  totalPrompts: z.number(),
  totalSessions: z.number(),
  totalLinesAdded: z.number(),
  totalLinesDeleted: z.number(),
  totalCodeGenerations: z.number(),
  totalCodeAcceptances: z.number(),
  totalPullRequestsCreated: z.number(),
  totalPullRequestsMerged: z.number(),
  featureBreakdown: z.array(CopilotFeatureUsageSummarySchema),
});

export type CopilotPremiumUsageItem = z.infer<typeof CopilotPremiumUsageItemSchema>;
export type CopilotPersonalUsageInput = z.infer<typeof CopilotPersonalUsageInputSchema>;
export type CopilotPersonalUsageSummary = z.infer<typeof CopilotPersonalUsageSummarySchema>;
export type CopilotOrgUsageInput = z.infer<typeof CopilotOrgUsageInputSchema>;
export type CopilotFeatureUsageSummary = z.infer<typeof CopilotFeatureUsageSummarySchema>;
export type CopilotOrganizationUsageSummary = z.infer<typeof CopilotOrganizationUsageSummarySchema>;
