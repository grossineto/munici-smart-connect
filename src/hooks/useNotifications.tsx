import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    // Setup realtime subscription for new notifications
    const channel = supabase
      .channel('new-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Show toast notification
          toast({
            title: notification.title,
            description: notification.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: string,
    data?: any
  ) => {
    try {
      const { error } = await supabase
        .from('notifications' as any)
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data: data || {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  return {
    createNotification
  };
}