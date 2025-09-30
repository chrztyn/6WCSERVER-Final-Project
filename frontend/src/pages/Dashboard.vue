<script>
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
};
</script>

<template>
  <div class="dashboard-container">
    <!-- Responsive grid layout -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      
      <!-- Left column - Main content -->
      <div class="grid gap-4 sm:gap-6 lg:gap-8">
        <GroupSummary />
        <QuickAccess />
        <RecentActivities />
      </div>
      
      <!-- Right column - Sidebar widgets -->
      <div class="grid gap-4 sm:gap-6 lg:gap-8">
        <BalanceOverview />
        <ReportOverview />
      </div>
    </div>
  </div>
</template>