import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AccountSource = 'antigravity' | 'opencode';

interface AccountSourceStore {
  selectedSource: AccountSource;
  setSelectedSource: (source: AccountSource) => void;
}

export const useAccountSourceStore = create<AccountSourceStore>()(
  persist(
    (set) => ({
      selectedSource: 'antigravity',
      setSelectedSource: (selectedSource) => {
        set({ selectedSource });
      },
    }),
    {
      name: 'account-source-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
