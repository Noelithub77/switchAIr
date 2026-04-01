import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activateOpencodeAccount,
  exportOpencodeBundle,
  importOpencodeBundle,
  listOpencodeAccounts,
  removeOpencodeLiveAuth,
  syncOpencodeAccounts,
  updateOpencodeAccountNote,
} from '@/actions/opencode';

import type { OpencodeAccount } from '@/types/opencode-account';

export const OPENCODE_QUERY_KEYS = {
  accounts: ['opencodeAccounts'],
};

export function useOpencodeAccounts() {
  return useQuery<OpencodeAccount[]>({
    queryKey: OPENCODE_QUERY_KEYS.accounts,
    queryFn: listOpencodeAccounts,
    staleTime: 1000 * 30,
  });
}

export function useSyncOpencodeAccounts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncOpencodeAccounts,
    onSuccess: (accounts) => {
      queryClient.setQueryData(OPENCODE_QUERY_KEYS.accounts, accounts);
      queryClient.invalidateQueries({ queryKey: OPENCODE_QUERY_KEYS.accounts });
    },
  });
}

export function useActivateOpencodeAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateOpencodeAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPENCODE_QUERY_KEYS.accounts });
    },
  });
}

export function useRemoveOpencodeLiveAuth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeOpencodeLiveAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPENCODE_QUERY_KEYS.accounts });
    },
  });
}

export function useUpdateOpencodeAccountNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOpencodeAccountNote,
    onSuccess: (account) => {
      queryClient.setQueryData(
        OPENCODE_QUERY_KEYS.accounts,
        (oldData: OpencodeAccount[] | undefined) => {
          if (!oldData) {
            return [account];
          }

          return oldData.map((candidate) => (candidate.id === account.id ? account : candidate));
        },
      );
      queryClient.invalidateQueries({ queryKey: OPENCODE_QUERY_KEYS.accounts });
    },
  });
}

export function useExportOpencodeBundle() {
  return useMutation({
    mutationFn: exportOpencodeBundle,
  });
}

export function useImportOpencodeBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importOpencodeBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPENCODE_QUERY_KEYS.accounts });
    },
  });
}
