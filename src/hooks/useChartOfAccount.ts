import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChartOfAccountService } from '../services/ChartOfAccountService';
import type { ChartOfAccount, ChartOfAccounts, GLCodeOption } from '../types/chartOfAccount';

export const useChartOfAccounts = (includeInactive = false) => {
  return useQuery<ChartOfAccounts, Error>({
    queryKey: ['chart-of-accounts', { includeInactive }],
    queryFn: () => ChartOfAccountService.getChartOfAccounts(includeInactive),
  });
};

export const useGLCodes = (search?: string) => {
  return useQuery<GLCodeOption[], Error>({
    queryKey: ['purchasing', 'gl-codes', search],
    queryFn: () => ChartOfAccountService.getGLCodes(search),
    staleTime: 5 * 60 * 1000,
  });
};

export const useChartOfAccount = (id: number | string) => {
  return useQuery<ChartOfAccount, Error>({
    queryKey: ['chart-of-accounts', id],
    queryFn: () => ChartOfAccountService.getChartOfAccount(id),
  });
};

export const useInsertChartOfAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChartOfAccount) => ChartOfAccountService.insertChartOfAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['purchasing', 'gl-codes'] });
    },
  });
};

export const useDeleteChartOfAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ChartOfAccountService.deleteChartOfAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['purchasing', 'gl-codes'] });
    },
  });
};

export const useUpdateChartOfAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChartOfAccount) => ChartOfAccountService.updateChartOfAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['purchasing', 'gl-codes'] });
    },
  });
};

export const useSetChartOfAccountStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      ChartOfAccountService.setChartOfAccountStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['purchasing', 'gl-codes'] });
    },
  });
};
