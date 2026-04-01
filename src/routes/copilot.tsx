import { createFileRoute } from '@tanstack/react-router';

import { CopilotUsagePage } from '@/components/copilot/CopilotUsagePage';

export const Route = createFileRoute('/copilot')({
  component: CopilotUsagePage,
});
