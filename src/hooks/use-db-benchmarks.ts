import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Benchmark } from '@/lib/types';
import { toast } from 'sonner';

export function useDbBenchmarks() {
  const queryClient = useQueryClient();

  const { data: benchmarks = [], isLoading } = useQuery<Benchmark[]>({
    queryKey: ['benchmarks'],
    queryFn: async () => {
      const response = await fetch('/api/v1/benchmarks');
      if (!response.ok) throw new Error('Failed to fetch benchmarks');
      return response.json();
    },
  });

  const addBenchmarkMutation = useMutation({
    mutationFn: async (benchmark: Benchmark) => {
      const response = await fetch('/api/v1/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(benchmark),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add benchmark');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
    },
    onError: (error: any) => {
      toast.error(`保存数据失败: ${error.message}`);
    },
  });

  const deleteBenchmarkMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/benchmarks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete benchmark');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
      toast.success('删除成功');
    },
    onError: () => {
      toast.error('删除失败');
    },
  });

  const importBenchmarksMutation = useMutation({
    mutationFn: async ({ config, file }: { config: any; file: File }) => {
      const formData = new FormData();
      formData.append('config', JSON.stringify(config));
      formData.append('file', file);

      const response = await fetch('/api/v1/benchmarks/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload benchmarks');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
      toast.success('成功导入数据');
    },
    onError: (error: any) => {
      toast.error(`导入失败: ${error.message}`);
    },
  });

  return {
    benchmarks,
    isLoading,
    addBenchmark: addBenchmarkMutation.mutateAsync,
    deleteBenchmark: deleteBenchmarkMutation.mutateAsync,
    importBenchmarks: importBenchmarksMutation.mutateAsync,
  };
}
