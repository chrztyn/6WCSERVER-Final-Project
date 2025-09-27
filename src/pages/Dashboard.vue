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
  <!-- Content area only; Sidebar and Topbar now live in layout -->
  <div class="grid grid-cols-[1fr_340px] gap-8 p-8 max-w-[1400px] mx-auto">
    <div class="grid gap-8">
      <GroupSummary />
      <QuickAccess />
      <RecentActivities />
    </div>
    <div class="grid gap-8">
      <BalanceOverview />
      <ReportOverview />
    </div>
  </div>
</div>
</template>