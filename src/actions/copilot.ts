import { ipc } from '@/ipc/manager';
import type {
  CopilotOrgUsageInput,
  CopilotOrganizationUsageSummary,
  CopilotPersonalUsageInput,
  CopilotPersonalUsageSummary,
} from '@/types/copilot-usage';

export function getPersonalCopilotUsage(
  input: CopilotPersonalUsageInput,
): Promise<CopilotPersonalUsageSummary> {
  return ipc.client.copilot.getPersonalUsage(input);
}

export function getOrganizationCopilotUsage(
  input: CopilotOrgUsageInput,
): Promise<CopilotOrganizationUsageSummary> {
  return ipc.client.copilot.getOrganizationUsage(input);
}
