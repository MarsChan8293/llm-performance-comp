import { useState, useEffect, useCallback } from 'react';
import { Benchmark } from '@/lib/types';
import { toast } from 'sonner';

export function useDbBenchmarks() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBenchmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/benchmarks');
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
      const response = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(benchmark),
      });
      if (!response.ok) throw new Error('Failed to add benchmark');
      
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
    } catch (error) {
      console.error('Error adding benchmark:', error);
      toast.error('保存数据失败');
      return false;
    }
  };

  const deleteBenchmark = async (id: string) => {
    try {
      const response = await fetch(`/api/benchmarks/${id}`, {
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

  const importBenchmarks = async (newBenchmarks: Benchmark[]) => {
    try {
      // For simplicity, we'll send them one by one or implement a bulk endpoint
      // Here we'll just loop for now, but a bulk endpoint would be better
      const promises = newBenchmarks.map(b => 
        fetch('/api/benchmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(b),
        })
      );
      
      await Promise.all(promises);
      await fetchBenchmarks(); // Refresh all
      toast.success(`成功导入 ${newBenchmarks.length} 条数据`);
      return true;
    } catch (error) {
      console.error('Error importing benchmarks:', error);
      toast.error('导入失败');
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
