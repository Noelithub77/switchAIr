import { os } from '@orpc/server';

import { getOrganizationCopilotUsage, getPersonalCopilotUsage } from '@/ipc/copilot/handler';
import {
  CopilotOrgUsageInputSchema,
  CopilotOrganizationUsageSummarySchema,
  CopilotPersonalUsageInputSchema,
  CopilotPersonalUsageSummarySchema,
} from '@/types/copilot-usage';

export const copilotRouter = os.router({
  getPersonalUsage: os
    .input(CopilotPersonalUsageInputSchema)
    .output(CopilotPersonalUsageSummarySchema)
    .handler(async ({ input }) => {
      return getPersonalCopilotUsage(input);
    }),

  getOrganizationUsage: os
    .input(CopilotOrgUsageInputSchema)
    .output(CopilotOrganizationUsageSummarySchema)
    .handler(async ({ input }) => {
      return getOrganizationCopilotUsage(input);
    }),
});
