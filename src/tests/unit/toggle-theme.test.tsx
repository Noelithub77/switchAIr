// @vitest-environment happy-dom
import { render } from '@testing-library/react';
import { beforeEach, test, expect } from 'vitest';
import ToggleTheme from '@/components/toggle-theme';
import { useAccountSourceStore } from '@/store/account-source.store';

beforeEach(() => {
  localStorage.clear();
  useAccountSourceStore.setState({ selectedSource: 'antigravity' });
});

test('renders ToggleTheme', () => {
  const { getByRole } = render(<ToggleTheme />);
  const isButton = getByRole('button');

  expect(isButton).toBeTruthy();
});

test('has icon', () => {
  const { getByRole } = render(<ToggleTheme />);
  const button = getByRole('button');
  const icon = button.querySelector('svg');

  expect(icon).toBeTruthy();
});

test('is moon icon', () => {
  const svgIconClassName: string = 'lucide-moon';
  const { getByRole } = render(<ToggleTheme />);
  const svg = getByRole('button').querySelector('svg');

  expect(svg?.classList).toContain(svgIconClassName);
});

test('account source store defaults to antigravity', () => {
  expect(useAccountSourceStore.getState().selectedSource).toBe('antigravity');
});

test('account source store restores previous tab from persisted state', async () => {
  localStorage.setItem(
    'account-source-store',
    JSON.stringify({
      state: { selectedSource: 'opencode' },
      version: 0,
    }),
  );

  await useAccountSourceStore.persist.rehydrate();

  expect(useAccountSourceStore.getState().selectedSource).toBe('opencode');
});
