import { supabase } from '@/integrations/supabase/client';

interface DatabaseNotification {
  id: string;
  user_id: string;
  message: string;
  service_id?: string;
  is_read: boolean;
  created_at: string;
}

export const getNotifications = async (): Promise<DatabaseNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[NOTIFICATIONS] Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to fetch notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('[NOTIFICATIONS] Error marking notification as read:', error);
      throw error;
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to mark notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.error('[NOTIFICATIONS] Error marking all notifications as read:', error);
      throw error;
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to mark all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('[NOTIFICATIONS] Error deleting notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to delete notification:', error);
    throw error;
  }
};

export const createNotification = async (
  userId: string, 
  message: string, 
  serviceId?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message,
        service_id: serviceId,
        is_read: false
      });

    if (error) {
      console.error('[NOTIFICATIONS] Error creating notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to create notification:', error);
    throw error;
  }
};