import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Message } from '@/lib/types';
import { toast } from 'sonner';

export function useDbMessages() {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await fetch('/api/v1/messages');
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
  });

  const addMessageMutation = useMutation({
    mutationFn: async (message: Message) => {
      const response = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: any) => {
      toast.error(`提交留言失败: ${error.message}`);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/messages/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('留言已删除');
    },
    onError: () => {
      toast.error('删除失败');
    },
  });

  return {
    messages,
    isLoading,
    addMessage: addMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    refreshMessages: () => queryClient.invalidateQueries({ queryKey: ['messages'] })
  };
}
