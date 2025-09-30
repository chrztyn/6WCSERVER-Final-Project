<script>
import axios from 'axios';

export default {
  name: 'NotificationDropdown',
  data() {
    return {
      notifications: [],
      isLoading: false,
      pollingInterval: null,
      lastNotificationCount: 0
    };
  },
  async mounted() {
    await this.fetchNotifications();
    this.startPolling();
  },
  beforeUnmount() {
    this.stopPolling();
  },
  methods: {
    async fetchNotifications() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/transactions/recent?limit=10', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const newNotifications = response.data.transactions || [];
        
        // Check if there are new notifications
        if (newNotifications.length > this.lastNotificationCount && this.lastNotificationCount > 0) {
          this.playNotificationSound();
        }
        
        this.notifications = newNotifications;
        this.lastNotificationCount = newNotifications.length;
        
        // Calculate unread count
        const unreadCount = newNotifications.filter(n => !n.read).length;
        this.$emit('update:unread-count', unreadCount);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        this.isLoading = false;
      }
    },
    
    startPolling() {
      // Poll every 10 seconds (10000ms)
      this.pollingInterval = setInterval(() => {
        this.fetchNotifications();
      }, 10000);
    },
    
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },
    
    playNotificationSound() {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5; // 50% volume
      audio.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    },
    
    handleNotificationClick(notification) {
      console.log('Notification clicked:', notification);
      
      // Navigate based on transaction type and context
      if (notification.transaction_type === 'expense') {
        // For expenses, redirect to the transaction details modal
        if (notification._id) {
          this.$emit('notification-click', { 
            type: 'transaction', 
            id: notification._id 
          });
        }
      } else if (notification.transaction_type === 'payment' || notification.transaction_type === 'settlement') {
        // For payments and settlements, redirect to transaction details modal
        if (notification._id) {
          this.$emit('notification-click', { 
            type: 'transaction', 
            id: notification._id 
          });
        }
      } else if (notification.group_id) {
        // If it's a group-related notification, redirect to the group
        this.$emit('notification-click', { 
          type: 'group', 
          id: notification.group_id._id || notification.group_id 
        });
      } else {
        // Default: redirect to transaction page
        this.$emit('notification-click', { 
          type: 'transaction', 
          id: notification._id 
        });
      }
    },
    
    handleViewAll() {
      this.$emit('view-all');
    },
    
    formatDate(date) {
      const now = new Date();
      const notifDate = new Date(date);
      const diffMs = now - notifDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return notifDate.toLocaleDateString();
    },
    
    getNotificationIcon(type) {
      const icons = {
        'expense': '💰',
        'payment': '💸',
        'settlement': '🤝'
      };
      return icons[type] || '📌';
    },
    
    getNotificationMessage(notification) {
      const type = notification.transaction_type;
      
      if (type === 'expense') {
        return `New expense: ${notification.description}`;
      } else if (type === 'payment') {
        return `Payment received: ${notification.description}`;
      } else if (type === 'settlement') {
        return `Settlement: ${notification.description}`;
      }
      
      return notification.description;
    }
  }
};
</script>

<template>
  <div class="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 flex items-center justify-between">
      <h3 class="font-semibold text-gray-800">Notifications</h3>
      <span v-if="notifications.length > 0" class="text-xs text-gray-500">
        {{ notifications.length }} recent
      </span>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading && notifications.length === 0" class="p-8 text-center">
      <div class="animate-spin w-8 h-8 border-4 border-[#0761FE] border-t-transparent rounded-full mx-auto"></div>
      <p class="text-sm text-gray-500 mt-2">Loading...</p>
    </div>
    
    <!-- Notifications List -->
    <div v-else-if="notifications.length > 0" class="max-h-96 overflow-y-auto">
      <div
        v-for="notification in notifications"
        :key="notification._id"
        @click="handleNotificationClick(notification)"
        class="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span class="text-lg">{{ getNotificationIcon(notification.transaction_type) }}</span>
          </div>
          
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">
              {{ getNotificationMessage(notification) }}
            </p>
            <p class="text-xs text-gray-600 mt-1">
              <span v-if="notification.payer_id">{{ notification.payer_id.name }}</span>
              <span v-if="notification.receiver_id"> → {{ notification.receiver_id.name }}</span>
            </p>
            <p class="text-xs text-gray-500 mt-1" v-if="notification.group_id">
              Group: {{ notification.group_id.name || 'Unknown' }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ formatDate(notification.transaction_date || notification.created_at) }}
            </p>
          </div>
          
          <div class="flex-shrink-0 text-sm font-semibold text-[#0761FE]">
            ₱{{ notification.amount.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="p-8 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <span class="text-3xl">🔔</span>
      </div>
      <p class="text-sm text-gray-600">No notifications yet</p>
    </div>
    
    <!-- Footer -->
    <div class="p-3 border-t border-gray-200 text-center">
      <button
        @click="handleViewAll"
        class="text-sm text-[#0761FE] hover:text-[#013DC0] font-medium"
      >
        View All Activity
      </button>
    </div>
  </div>
</template>