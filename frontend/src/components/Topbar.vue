<script>
import NotificationDropdown from './NotificationDropdown.vue';
import axios from "axios";

export default {
  name: "Topbar",
  components: {
    NotificationDropdown
  },
  data() {
    return {
      showNotifications: false,
      unreadCount: 0,
      searchQuery: "",
      searchResults: [], 
      showSearchResults: false,
      notificationPollingInterval: null
    };
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
    this.startNotificationPolling();
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    this.stopNotificationPolling();
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
      console.log('Notification clicked:', notification);
      this.showNotifications = false;
      
      // Navigate based on notification type
      if (notification.group_id) {
        this.$router.push(`/group/${notification.group_id}`);
      } else if (notification._id) {
        this.$router.push(`/transaction/${notification._id}`);
      }
    },
    
    async handleSearch() {
      if (!this.searchQuery.trim()) {
        this.searchResults = [];
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:3001/api/search?q=${encodeURIComponent(this.searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.searchResults = res.data;
      } catch (err) {
        console.error("Search failed:", err);
        this.searchResults = [];
      }
    },
    
    selectSearchResult(result) {
      console.log("Selected:", result);
      this.searchQuery = ""; 
      this.searchResults = [];
      this.showSearchResults = false;

      if (result.type === 'group') {
        this.$router.push(`/group/${result._id}`);
      } else if (result.type === 'expense') {
        this.$router.push(`/group/${result.group}`);
      } else if (result.type === 'user') {
        this.$router.push('/group');
      } else if (result.type === 'transaction') {
        this.$router.push(`/transaction/${result._id}`);
      }
    },
    
    hideSearchWithDelay() {
      setTimeout(() => {
        this.showSearchResults = false;
      }, 200);
    },
    
    handleViewAll() {
      console.log('View all clicked');
      this.$router.push('/transaction');
      this.showNotifications = false;
    },
    
    updateUnreadCount(count) {
      this.unreadCount = count;
    },
    
    async startNotificationPolling() {
      await this.fetchUnreadCount();
      
      // Poll every 30 seconds for unread count
      this.notificationPollingInterval = setInterval(() => {
        this.fetchUnreadCount();
      }, 3000);
    },
        
    stopNotificationPolling() {
      if (this.notificationPollingInterval) {
        clearInterval(this.notificationPollingInterval);
        this.notificationPollingInterval = null;
      }
    },

    handleNotificationClick(notificationData) {
      console.log('Notification clicked:', notificationData);
      this.showNotifications = false;
      
      // Navigate based on notification type
      if (notificationData.type === 'transaction') {
        // Redirect to transaction details modal
        this.$router.push(`/transaction/${notificationData.id}`);
      } else if (notificationData.type === 'group') {
        // Redirect to group page
        this.$router.push(`/group/${notificationData.id}`);
      } else {
        // Fallback: redirect to transaction page
        this.$router.push('/transaction');
      }
    },
    
    async fetchUnreadCount() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/transactions/recent?limit=10', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const transactions = response.data.transactions || [];
        const unread = transactions.filter(t => !t.read).length;
        this.unreadCount = unread;
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    }
  }
};
</script>

<template>
  <!-- Same template as before -->
  <div class="flex items-center gap-4 p-6 w-full mx-auto bg-white border-b border-gray-200 shadow-sm">
    <div class="text-xl font-bold text-[#0761FE] tracking-tight">SplitSmart</div>
    
    <!-- Search Bar -->
    <div class="flex-1 relative">
      <input 
        v-model="searchQuery"
        @input="handleSearch"
        @focus="showSearchResults = true"
        @blur="hideSearchWithDelay"
        class="w-full h-10 rounded-lg border border-gray-300 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0761FE] focus:border-transparent transition-all" 
        placeholder="Search groups, expenses, or people..." 
      />
      <svg class="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>

      <!-- Dropdown Results -->
      <ul 
        v-if="showSearchResults && searchResults.length > 0" 
        class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <li 
          v-for="result in searchResults" 
          :key="result._id" 
          @mousedown.prevent="selectSearchResult(result)"
          class="px-4 py-3 text-sm cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="font-medium text-gray-900">
                {{ result.name }}
              </div>
              <div v-if="result.description" class="text-xs text-gray-500 mt-0.5">
                {{ result.description }}
              </div>
              <div v-if="result.amount" class="text-xs text-green-600 mt-0.5 font-semibold">
                ₱{{ result.amount.toFixed(2) }}
              </div>
              <div v-if="result.email" class="text-xs text-gray-500 mt-0.5">
                {{ result.email }}
              </div>
              <div v-if="result.group_name" class="text-xs text-gray-500 mt-0.5">
                Group: {{ result.group_name }}
              </div>
            </div>
            <span class="text-xs text-gray-400 ml-2">
              {{ result.type === 'group' ? '👥' : 
                 result.type === 'expense' ? '💰' : 
                 result.type === 'transaction' ? '📝' : 
                 '👤' }}
            </span>
          </div>
        </li>
      </ul>
      
      <!-- No Results Message -->
      <div
        v-if="showSearchResults && searchQuery && searchResults.length === 0"
        class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500"
      >
        No results found for "{{ searchQuery }}"
      </div>
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