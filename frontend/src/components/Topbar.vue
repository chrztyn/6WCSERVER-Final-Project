<script>
import NotificationDropdown from './NotificationDropdown.vue';

export default {
  name: "Topbar",
  components: {
    NotificationDropdown
  },
  data() {
    return {
      showNotifications: false,
      unreadCount: 0
    };
  },
  mounted() {
    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
    },
    handleClickOutside(event) {
      const notificationButton = this.$refs.notificationButton;
      const notificationDropdown = this.$refs.notificationDropdown;
      
      if (notificationButton && !notificationButton.contains(event.target) &&
          notificationDropdown && !notificationDropdown.$el.contains(event.target)) {
        this.showNotifications = false;
      }
    },
    handleNotificationClick(notification) {
      // Handle navigation based on notification type
      console.log('Notification clicked:', notification);
      // You can add router navigation here
      // Example: this.$router.push(`/groups/${notification.group_id}`);
    },
    handleViewAll() {
      // Navigate to full activity/transaction history page
      console.log('View all clicked');
      // Example: this.$router.push('/activity');
      this.showNotifications = false;
    },
    updateUnreadCount(count) {
      this.unreadCount = count;
    }
  }
};
</script>

<template>
  <div class="flex items-center gap-4 p-6 w-full mx-auto bg-white border-b border-gray-200 shadow-sm">
    <div class="text-xl font-bold text-[#0761FE] tracking-tight">SplitSmart</div>
    
    <!-- Search Bar -->
    <div class="flex-1 relative">
      <input 
        class="w-full h-10 rounded-lg border border-gray-300 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0761FE] focus:border-transparent transition-all" 
        placeholder="Search groups, expenses, or people..." 
      />
      <svg class="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
    </div>

    <!-- Notification Button -->
    <div class="relative">
      <button
        ref="notificationButton"
        @click="toggleNotifications"
        class="h-10 w-10 rounded-lg bg-[#0761FE] hover:bg-[#013DC0] flex items-center justify-center border-none p-0 transition-colors relative"
      >
        <img src="/Icons/light notif.png" alt="Light Notification Icon" class="h-6 w-6">
        
        <!-- Unread Badge -->
        <span 
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </button>

      <!-- Notification Dropdown -->
      <NotificationDropdown
        v-if="showNotifications"
        ref="notificationDropdown"
        @notification-click="handleNotificationClick"
        @view-all="handleViewAll"
        @update:unread-count="updateUnreadCount"
      />
    </div>
  </div>
</template>
