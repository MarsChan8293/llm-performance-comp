import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ComparisonReport } from '@/lib/types';
import { toast } from 'sonner';

export function useDbReports() {
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<ComparisonReport[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await fetch('/api/v1/reports');
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
  });

  const addReportMutation = useMutation({
    mutationFn: async (report: ComparisonReport) => {
      const response = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add report');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error: Error) => {
      toast.error(`保存报告失败: ${error.message}`);
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/reports/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete report');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('报告已删除');
    },
    onError: () => {
      toast.error('删除报告失败');
    },
  });

  return {
    reports,
    isLoading,
    addReport: addReportMutation.mutateAsync,
    deleteReport: deleteReportMutation.mutateAsync,
    refreshReports: () => queryClient.invalidateQueries({ queryKey: ['reports'] })
  };
}
