
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  isConnected: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  read: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: UIState['theme']) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  setConnectionStatus: (connected: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  // Estado inicial
  sidebarOpen: false,
  theme: 'system',
  notifications: [],
  isConnected: false,

  // Ações
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  setTheme: (theme) => {
    set({ theme });
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50) // Manter apenas 50
    }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(notif => notif.id !== id)
    }));
  },

  setConnectionStatus: (connected) => {
    set({ isConnected: connected });
  },
}));
