<script>
import axios from 'axios';

export default {
  name: 'NotificationDropdown',
  data() {
    return {
      notifications: [],
      loading: true
    };
  },
  mounted() {
    this.fetchNotifications();
  },
  methods: {
    async fetchNotifications() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/transactions/recent?limit=20', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let transactions = response.data.transactions || [];
        
        const seenGroupEvents = new Set();
        const deduplicatedTransactions = [];
        
        for (const transaction of transactions) {
          if (transaction.transaction_type === 'group_left' || transaction.transaction_type === 'group_joined' || transaction.transaction_type === 'group_created') {
            const timestamp = new Date(transaction.transaction_date || transaction.created_at).getTime();
            const roundedTime = Math.floor(timestamp / 60000);
            const eventKey = `${transaction.transaction_type}-${transaction.payer_id?._id || transaction.payer_id}-${transaction.group_id?._id || transaction.group_id}-${roundedTime}`;

            if (seenGroupEvents.has(eventKey)) {
              continue;
            }
            seenGroupEvents.add(eventKey);
          }
          
          deduplicatedTransactions.push(transaction);
        }
        
        this.notifications = deduplicatedTransactions.slice(0, 10);
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.$emit('update:unread-count', unreadCount);
        
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        this.loading = false;
      }
    },
    
    getNotificationIcon(type) {
      const icons = {
        'settlement': '✅',
        'payment': '💳',
        'expense': '💰',
        'expense_added': '💰',
        'group_joined': '👥',
        'group_created': '🎉',
        'group_left': '👋',
        'refund': '↩️'
      };
      return icons[type] || '📢';
    },
    
    getNotificationColor(type) {
      const colors = {
        'settlement': 'text-green-600',
        'payment': 'text-green-600',
        'expense': 'text-red-600',
        'expense_added': 'text-red-600',
        'group_joined': 'text-blue-600',
        'group_created': 'text-purple-600',
        'group_left': 'text-orange-600',
        'refund': 'text-yellow-600'
      };
      return colors[type] || 'text-gray-600';
    },
    
    async markAsRead(notification) {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(
          `http://localhost:3001/api/transactions/${notification._id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        notification.read = true;
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.$emit('update:unread-count', unreadCount);
        
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    
    handleNotificationClick(notification) {
      console.log('Full notification object:', notification);
      console.log('notification.transaction_type:', notification.transaction_type);
      console.log('notification.group_id:', notification.group_id);
      
      this.markAsRead(notification);
      
      const groupTypes = ['group_created', 'group_joined', 'group_left', 'expense_added'];
      const transactionTypes = ['settlement', 'payment', 'expense_completion', 'expense_deletion'];
      
      // Use transaction_type instead of type
      const notificationType = notification.transaction_type;
      
      console.log('Is group type?', groupTypes.includes(notificationType));
      console.log('Has group_id?', !!notification.group_id);
      
      // Extract group ID (could be object or string)
      let groupId = null;
      if (notification.group_id) {
        groupId = typeof notification.group_id === 'object' ? notification.group_id._id : notification.group_id;
      }
      console.log('Extracted groupId:', groupId);
      
      // Extract user ID from the notification
      let userId = null;
      if (notification.user_id) {
        userId = typeof notification.user_id === 'object' ? notification.user_id._id : notification.user_id;
      } else if (notification.payer_id) {
        userId = typeof notification.payer_id === 'object' ? notification.payer_id._id : notification.payer_id;
      }
      
      console.log('Extracted userId from notification:', userId);
      
      if (groupTypes.includes(notificationType) && groupId) {
        console.log('Emitting group notification with ID:', groupId);
        this.$emit('notification-click', {
          type: 'group',
          id: groupId,
          activityType: notificationType,  // Pass the transaction_type
          userId: userId
        });
      } else if (transactionTypes.includes(notificationType) && notification._id) {
        console.log('Emitting transaction notification');
        this.$emit('notification-click', {
          type: 'transaction',
          id: notification._id
        });
      } else {
        console.log('Fallback emission');
        const id = groupId || notification._id;
        if (id) {
          this.$emit('notification-click', {
            type: groupId ? 'group' : 'transaction',
            id,
            activityType: notificationType,
            userId: userId
          });
        } else {
          console.warn('No valid ID found for notification:', notification);
        }
      }
    },
    
    handleViewAll() {
      this.$emit('view-all');
    }
  }
};
</script>

<template>
  <div class="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
    <div class="p-4 border-b border-gray-200">
      <h3 class="font-semibold text-gray-800">Notifications</h3>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="p-4 space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="flex gap-3">
          <div class="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Notifications List -->
    <div v-else-if="notifications.length > 0" class="overflow-y-auto flex-1">
      <div
        v-for="notification in notifications"
        :key="notification._id"
        @click="handleNotificationClick(notification)"
        class="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
        :class="{ 'bg-blue-50': !notification.read }"
      >
        <div class="flex gap-3">
          <div class="flex-shrink-0">
            <span class="text-2xl">{{ getNotificationIcon(notification.type) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm" :class="getNotificationColor(notification.type)">
              {{ notification.title }}
            </p>
            <p class="text-xs text-gray-600 mt-1">{{ notification.description }}</p>
            <p class="text-xs text-gray-400 mt-1">
              {{ new Date(notification.created_at).toLocaleString() }}
            </p>
          </div>
          <div v-if="!notification.read" class="flex-shrink-0">
            <div class="h-2 w-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="p-8 text-center">
      <p class="text-gray-500 text-sm">No notifications yet</p>
    </div>
    
    <!-- View All Button -->
    <div class="p-3 border-t border-gray-200">
      <button
        @click="handleViewAll"
        class="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        View All Notifications
      </button>
    </div>
  </div>
</template>