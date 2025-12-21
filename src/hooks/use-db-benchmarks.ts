import { useState, useEffect, useCallback } from 'react';
import { Benchmark } from '@/lib/types';
import { toast } from 'sonner';

export function useDbBenchmarks() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBenchmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/benchmarks');
      if (!response.ok) throw new Error('Failed to fetch benchmarks');
      const data = await response.json();
      setBenchmarks(data);
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      toast.error('无法从数据库加载数据，请检查后端服务是否启动');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

  const addBenchmark = async (benchmark: Benchmark) => {
    try {
      const response = await fetch('/api/v1/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(benchmark),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add benchmark');
      }
      
      // Update local state
      setBenchmarks(prev => {
        const index = prev.findIndex(b => b.id === benchmark.id);
        if (index >= 0) {
          const newBenchmarks = [...prev];
          newBenchmarks[index] = benchmark;
          return newBenchmarks;
        }
        return [benchmark, ...prev];
      });
      
      return true;
    } catch (error: any) {
      console.error('Error adding benchmark:', error);
      toast.error(`保存数据失败: ${error.message}`);
      return false;
    }
  };

  const deleteBenchmark = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/benchmarks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete benchmark');
      
      setBenchmarks(prev => prev.filter(b => b.id !== id));
      toast.success('删除成功');
      return true;
    } catch (error) {
      console.error('Error deleting benchmark:', error);
      toast.error('删除失败');
      return false;
    }
  };

  const importBenchmarks = async (config: any, file: File) => {
    try {
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
      
      await fetchBenchmarks(); // Refresh all
      toast.success('成功导入数据');
      return true;
    } catch (error: any) {
      console.error('Error importing benchmarks:', error);
      toast.error(`导入失败: ${error.message}`);
      return false;
    }
  };


  return {
    benchmarks,
    isLoading,
    addBenchmark,
    deleteBenchmark,
    importBenchmarks,
    refresh: fetchBenchmarks
  };
}
