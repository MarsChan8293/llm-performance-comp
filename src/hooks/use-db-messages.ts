import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/lib/types';
import { toast } from 'sonner';

export function useDbMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/messages');
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Don't show toast for every fetch error to avoid spamming
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = async (message: Message) => {
    try {
      const response = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add message');
      }
      
      const savedMessage = await response.json();
      
      // Update local state
      setMessages(prev => [savedMessage, ...prev]);
      
      return true;
    } catch (error: any) {
      console.error('Error adding message:', error);
      toast.error(`提交留言失败: ${error.message}`);
      return false;
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/messages/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete message');
      
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success('留言已删除');
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('删除失败');
      return false;
    }
  };

  return {
    messages,
    addMessage,
    deleteMessage,
    isLoading,
    refreshMessages: fetchMessages
  };
}
