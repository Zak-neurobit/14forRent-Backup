
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id?: string;
  user_id: string;
  listing_id?: string;
  type: 'favorite' | 'view' | 'listing_created' | 'listing_updated' | 'admin';
  message: string;
  read?: boolean;
  created_at?: string;
}

export const createNotification = async (notification: Notification) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select();

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }

    return data?.[0];
  } catch (error) {
    console.error("Error in createNotification:", error);
    throw error;
  }
};

export const getNotifications = async (userId: string, options: { limit?: number, unreadOnly?: boolean } = {}) => {
  try {
    let query = supabase
      .from('notifications')
      .select(`
        id, 
        type, 
        message, 
        read, 
        created_at, 
        listing_id, 
        listings(title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (options.unreadOnly) {
      query = query.eq('read', false);
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getNotifications:", error);
    throw error;
  }
};

export const markAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in markAsRead:", error);
    throw error;
  }
};

export const getUnreadCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error("Error getting unread notifications count:", error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    throw error;
  }
};
