import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useNotificationStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    notifications: [],
    unreadCount: 0,
    filters: {
      eventType: 'all',
      search: '',
      status: 'all'
    },
    pagination: {
      page: 1,
      limit: 20,
      hasMore: true
    },
    isLoading: false,
    isConnected: false,

    // Actions
    addNotification: (notification) => {
      set((state) => {
        const newNotification = {
          ...notification,
          id: notification.eventId || `notif_${Date.now()}_${Math.random()}`,
          timestamp: notification.timestamp || new Date().toISOString(),
          status: 'new',
          isRead: false
        };

        const updatedNotifications = [newNotification, ...state.notifications];
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;

        return {
          notifications: updatedNotifications.slice(0, 100), // Keep only last 100
          unreadCount
        };
      });
    },

    markAsRead: (notificationId) => {
      set((state) => {
        const updatedNotifications = state.notifications.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true, status: 'read' } : notif
        );
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;

        return {
          notifications: updatedNotifications,
          unreadCount
        };
      });
    },

    markAllAsRead: () => {
      set((state) => ({
        notifications: state.notifications.map(notif => ({ ...notif, isRead: true, status: 'read' })),
        unreadCount: 0
      }));
    },

    clearNotifications: () => {
      set({
        notifications: [],
        unreadCount: 0
      });
    },

    setFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
        pagination: { ...state.pagination, page: 1 } // Reset to first page
      }));
    },

    setPagination: (pagination) => {
      set((state) => ({
        pagination: { ...state.pagination, ...pagination }
      }));
    },

    setLoading: (isLoading) => {
      set({ isLoading });
    },

    setConnectionStatus: (isConnected) => {
      set({ isConnected });
    },

    // Computed values
    getFilteredNotifications: () => {
      const { notifications, filters } = get();
      let filtered = notifications;

      // Filter by event type
      if (filters.eventType !== 'all') {
        filtered = filtered.filter(notif => notif.eventType === filters.eventType);
      }

      // Filter by status
      if (filters.status !== 'all') {
        filtered = filtered.filter(notif => notif.status === filters.status);
      }

      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(notif => 
          notif.userInfo?.username?.toLowerCase().includes(searchLower) ||
          notif.senderId?.toString().includes(searchLower) ||
          notif.content?.text?.toLowerCase().includes(searchLower) ||
          notif.eventType?.toLowerCase().includes(searchLower)
        );
      }

      return filtered;
    },

    getUnreadNotifications: () => {
      return get().notifications.filter(notif => !notif.isRead);
    }
  }))
);

export default useNotificationStore;
