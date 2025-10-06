<script>
import axios from 'axios';
import GroupSummary from "../components/dashboard/GroupSummary.vue";
import QuickAccess from "../components/dashboard/QuickAccess.vue";
import RecentActivities from "../components/dashboard/RecentActivities.vue";
import BalanceOverview from "../components/dashboard/BalanceOverview.vue";
import ReportOverview from "../components/dashboard/ReportOverview.vue";

export default {
  name: "Dashboard",
  components: {
    GroupSummary,
    QuickAccess,
    RecentActivities,
    BalanceOverview,
    ReportOverview,
  },
  methods: {
      async handleActivityClick(data) {
      // Debug localStorage
      console.log('Raw localStorage user:', localStorage.getItem('user'));
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Parsed currentUser:', currentUser);
      
      const currentUserId = currentUser._id || currentUser.id;
      
      console.log('=== Activity Click Debug ===');
      console.log('Data received:', data);
      console.log('Type:', data.type);
      console.log('ID:', data.id);
      console.log('ID type:', typeof data.id);
      console.log('user ID:', data.userId);
      console.log('current user ID:', currentUserId);
      console.log('Token exists:', !!localStorage.getItem('token'));

      if (data.type === 'transaction') {
          this.$router.push(`/transaction/${data.id}`);
      } else if (data.type === 'group') {
          if (data.activityType === 'group_left' && data.userId === currentUserId) {
            console.log('Current User left this group');
            return;
          }
          
          try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5173/api/groups/${data.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('API Response:', response.data);

            this.$router.push(`/group/${data.id}`);
            
          } catch (error) {
            console.log('Cannot access group:', error.response?.status);
            return;
          }
      }
    },
  }
};
</script>

<template>
  <div class="dashboard-container">
    <!-- Responsive grid layout that stretches -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
      
      <!-- Left column - Main content -->
      <div class="grid gap-4 sm:gap-6 lg:gap-8 lg:content-start">
        <GroupSummary />
        <QuickAccess />
         <RecentActivities 
            @activity-click="handleActivityClick"
        />
      </div>
      
      <!-- Right column - Sidebar widgets -->
      <div class="grid gap-4 sm:gap-6 lg:gap-8" style="grid-template-rows: 1fr 3fr;">
        <BalanceOverview />
        <ReportOverview />
      </div>
    </div>
  </div>
</template>