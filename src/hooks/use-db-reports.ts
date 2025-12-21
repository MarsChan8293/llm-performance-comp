import { useState, useEffect, useCallback } from 'react';
import { ComparisonReport } from '@/lib/types';
import { toast } from 'sonner';

export function useDbReports() {
  const [reports, setReports] = useState<ComparisonReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/reports');
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('无法加载对比报告');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const addReport = async (report: ComparisonReport) => {
    try {
      const response = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add report');
      }
      
      const savedReport = await response.json();
      
      setReports(prev => {
        const index = prev.findIndex(r => r.id === savedReport.id);
        if (index >= 0) {
          const newReports = [...prev];
          newReports[index] = savedReport;
          return newReports;
        }
        return [savedReport, ...prev];
      });
      
      return true;
    } catch (error: any) {
      console.error('Error adding report:', error);
      toast.error(`保存报告失败: ${error.message}`);
      return false;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/reports/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete report');
      
      setReports(prev => prev.filter(r => r.id !== id));
      toast.success('报告已删除');
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('删除报告失败');
      return false;
    }
  };

  return {
    reports,
    isLoading,
    addReport,
    deleteReport,
    refreshReports: fetchReports
  };
}
