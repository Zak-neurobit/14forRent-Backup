
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, markAsRead, getUnreadCount, Notification } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const NotificationPopover = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      // Fetch notifications and count in parallel for better performance
      const [notifs, count] = await Promise.all([
        getNotifications(user.id, { limit: 10 }),
        getUnreadCount(user.id)
      ]);
      
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // EXTREME DEFER - Notifications should NEVER impact initial page load
      // This is the lowest priority operation
      if ('requestIdleCallback' in window) {
        const idleId = requestIdleCallback(() => {
          // Even after idle, wait more
          setTimeout(fetchNotifications, 2000);
        }, { timeout: 10000 }); // 10 second max wait - absolute lowest priority
        
        return () => {
          if ('cancelIdleCallback' in window) {
            cancelIdleCallback(idleId);
          }
        };
      } else {
        // Fallback with extreme delay for older browsers
        const timeoutId = setTimeout(() => {
          fetchNotifications();
        }, 8000); // 8 second delay - notifications are lowest priority
        
        return () => clearTimeout(timeoutId);
      }
      
      // Note: Polling will be set up separately to avoid interfering with cleanup
    } else {
      setLoading(false);
    }
  }, [user]);

  // When the popover opens, refresh notifications
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      // Update the local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all as read in UI immediately for better UX
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Update in backend (one by one)
      for (const notif of notifications.filter(n => !n.read)) {
        await markAsRead(notif.id);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      // Refetch to get the correct state in case of error
      fetchNotifications();
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-3 flex justify-between items-center border-b">
          <h2 className="font-medium">Notifications</h2>
          {notifications.some(n => !n.read) && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div key={notif.id} className={`p-3 ${!notif.read ? 'bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm">{notif.message}</p>
                      {notif.listing_id && notif.listings?.title && (
                        <Link 
                          to={`/property/${notif.listing_id}`}
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => {
                            setOpen(false);
                            if (!notif.read) handleMarkAsRead(notif.id);
                          }}
                        >
                          {notif.listings.title}
                        </Link>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {notif.created_at && formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="ml-2 h-6 text-xs"
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                  <Separator className="mt-2" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
