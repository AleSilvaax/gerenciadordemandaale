
import { useUIStore } from '@/store/uiStore';
import { useEffect } from 'react';

export const useNotifications = () => {
  const {
    notifications,
    addNotification,
    markNotificationRead,
    removeNotification
  } = useUIStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  const showSuccess = (title: string, message: string) => {
    addNotification({ title, message, type: 'success' });
  };

  const showError = (title: string, message: string) => {
    addNotification({ title, message, type: 'error' });
  };

  const showWarning = (title: string, message: string) => {
    addNotification({ title, message, type: 'warning' });
  };

  const showInfo = (title: string, message: string) => {
    addNotification({ title, message, type: 'info' });
  };

  // Auto-remove notifications after 5 seconds for success/info
  useEffect(() => {
    const timer = setTimeout(() => {
      notifications
        .filter(n => ['success', 'info'].includes(n.type))
        .forEach(n => {
          if (Date.now() - n.timestamp.getTime() > 5000) {
            removeNotification(n.id);
          }
        });
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications, removeNotification]);

  return {
    notifications,
    unreadCount,
    markAsRead: markNotificationRead,
    remove: removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
