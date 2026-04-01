import { CopilotUsageService } from '@/services/CopilotUsage.service';
import type {
  CopilotOrgUsageInput,
  CopilotOrganizationUsageSummary,
  CopilotPersonalUsageInput,
  CopilotPersonalUsageSummary,
} from '@/types/copilot-usage';

export async function getPersonalCopilotUsage(
  input: CopilotPersonalUsageInput,
): Promise<CopilotPersonalUsageSummary> {
  return CopilotUsageService.getPersonalUsageSummary(input);
}

export async function getOrganizationCopilotUsage(
  input: CopilotOrgUsageInput,
): Promise<CopilotOrganizationUsageSummary> {
  return CopilotUsageService.getOrganizationUsageSummary(input);
}
