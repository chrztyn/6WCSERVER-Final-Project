<script>
import axios from 'axios';

export default {
  name: 'NotificationDropdown',
  data() {
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null
    };
  },
  mounted() {
    this.fetchNotifications();
    // Poll for new notifications every 30 seconds
    this.pollInterval = setInterval(() => {
      this.fetchNotifications();
    }, 30000);
  },
  beforeUnmount() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  },
  methods: {
    async fetchNotifications() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/transactions/recent', {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { limit: 10 }
        });
        
        this.notifications = this.formatNotifications(response.data.transactions || []);
        this.unreadCount = this.notifications.filter(n => !n.read).length;
      } catch (err) {
        console.error('Error fetching notifications:', err);
        this.error = 'Failed to load notifications';
      }
    },
    
    formatNotifications(transactions) {
      return transactions.map(transaction => {
        let message = '';
        let icon = '';
        let color = '';
        
        switch (transaction.transaction_type) {
          case 'expense':
            message = `${transaction.payer_id?.name || 'Someone'} added an expense: ${transaction.description}`;
            icon = '💰';
            color = 'bg-blue-100 text-blue-600';
            break;
          case 'payment':
            if (transaction.receiver_id?._id === this.getCurrentUserId()) {
              message = `${transaction.payer_id?.name || 'Someone'} paid you ₱${transaction.amount.toFixed(2)}`;
              icon = '✅';
              color = 'bg-green-100 text-green-600';
            } else {
              message = `You paid ${transaction.receiver_id?.name || 'someone'} ₱${transaction.amount.toFixed(2)}`;
              icon = '💸';
              color = 'bg-orange-100 text-orange-600';
            }
            break;
          case 'settlement':
            message = `${transaction.payer_id?.name || 'Someone'} settled debt with ${transaction.receiver_id?.name || 'someone'}`;
            icon = '🤝';
            color = 'bg-purple-100 text-purple-600';
            break;
          default:
            message = transaction.description || 'New activity';
            icon = '📌';
            color = 'bg-gray-100 text-gray-600';
        }
        
        return {
          id: transaction._id,
          message,
          icon,
          color,
          group: transaction.group_id?.name || 'Unknown Group',
          timestamp: transaction.transaction_date || transaction.created_at,
          read: transaction.read || false,
          type: transaction.transaction_type
        };
      });
    },
    
    getCurrentUserId() {
      // You might want to store user ID in localStorage or Vuex
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user._id;
    },
    
    async markAsRead(notificationId) {
      // Optional: Implement mark as read functionality if you add it to backend
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    },
    
    async markAllAsRead() {
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
    },
    
    getTimeAgo(timestamp) {
      const now = new Date();
      const time = new Date(timestamp);
      const diff = Math.floor((now - time) / 1000); // seconds
      
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
      return time.toLocaleDateString();
    },
    
    handleNotificationClick(notification) {
      this.markAsRead(notification.id);
      this.$emit('notification-click', notification);
      // You can add navigation logic here based on notification type
    }
  }
};
</script>

<template>
  <div class="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
      <h3 class="font-semibold text-gray-800">Notifications</h3>
      <button 
        v-if="unreadCount > 0"
        @click="markAllAsRead"
        class="text-xs text-[#0761FE] hover:text-[#013DC0] font-medium"
      >
        Mark all read
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-8 text-center">
      <div class="animate-spin w-8 h-8 border-4 border-[#0761FE] border-t-transparent rounded-full mx-auto"></div>
      <p class="text-sm text-gray-500 mt-2">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-8 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>

    <!-- Notifications List -->
    <div v-else-if="notifications.length > 0" class="overflow-y-auto flex-1">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        @click="handleNotificationClick(notification)"
        class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        :class="{ 'bg-blue-50': !notification.read }"
      >
        <div class="flex gap-3">
          <!-- Icon -->
          <div 
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="notification.color"
          >
            <span class="text-lg">{{ notification.icon }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-800 font-medium mb-1">
              {{ notification.message }}
            </p>
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span>{{ notification.group }}</span>
              <span>•</span>
              <span>{{ getTimeAgo(notification.timestamp) }}</span>
            </div>
          </div>

          <!-- Unread Indicator -->
          <div v-if="!notification.read" class="flex-shrink-0">
            <div class="w-2 h-2 bg-[#0761FE] rounded-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-8 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <p class="text-sm text-gray-600 font-medium mb-1">No notifications yet</p>
      <p class="text-xs text-gray-500">You'll see updates about expenses and payments here</p>
    </div>

    <!-- Footer -->
    <div class="p-3 border-t border-gray-200 bg-gray-50">
      <button 
        class="w-full text-center text-sm text-[#0761FE] hover:text-[#013DC0] font-medium py-1"
        @click="$emit('view-all')"
      >
        View all activity
      </button>
    </div>
  </div>
</template>
