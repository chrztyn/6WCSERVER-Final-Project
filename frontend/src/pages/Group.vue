<script>
import GroupListOverlay from '../components/GroupListOverlay.vue';

export default {
  name: "Group",
  components: {
    GroupListOverlay
  },
  data() {
    return {
      isOverlayOpen: true
    };
  },
  methods: {
    closeGroupList() {
      // Navigate back to dashboard when overlay is closed
      this.$router.push('/dashboard');
    },
    selectGroup(group) {
      console.log('Selected group:', group);
      // Navigate to the specific group expense list
      this.$router.push(`/group/${group.id}`);
      this.closeGroupList();
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 z-40"
      @click="closeGroupList"
    >
    <!-- Use GroupListOverlay component -->
      <GroupListOverlay 
        :is-open="isOverlayOpen"
        @close="closeGroupList"
        @select-group="selectGroup"
      />
    </div>
  </div>
</template>