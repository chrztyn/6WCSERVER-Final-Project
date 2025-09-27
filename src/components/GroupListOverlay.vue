<script>
import GroupItem from './GroupItem.vue';

export default {
  name: "GroupListOverlay",
  components: {
    GroupItem
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'select-group'],
  data() {
    return {
      groups: [
        {
          id: 1,
          name: "Group 1",
          activity: "Beach Vacation",
        },
        {
          id: 2,
          name: "Dinner Club",
          activity: "Monthly Dinners",
        },
        {
          id: 3,
          name: "Gym Buddies",
          activity: "Personal Training",
        },
        {
          id: 4,
          name: "Study Group",
          activity: "Course Materials",
        }
      ]
    };
  },
  methods: {
    closeOverlay() {
      this.$emit('close');
    },
    selectGroup(group) {
      this.$emit('select-group', group);
      this.closeOverlay();
    }
  }
};
</script>

<template>
  <!-- Backdrop -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-40"
    @click="closeOverlay"
  >
    <!-- Overlay Content -->
    <div 
      class="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
      @click.stop
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-[#0761FE] to-[#013DC0] text-white p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">Group List</h2>
          <button 
            @click="closeOverlay"
            class="text-white hover:text-gray-200 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 h-full flex flex-col">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">My Groups</h3>
          
          <!-- Add Group Button -->
          <button class="w-full bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg p-3 font-medium transition-colors mb-4 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add New Group
          </button>
        </div>

        <!-- Groups List -->
        <div class="flex-1 overflow-y-auto">
          <div class="space-y-3">
            <GroupItem 
              v-for="group in groups" 
              :key="group.id"
              :group="group"
              @select-group="selectGroup"
            />
          </div>

          <!-- Empty State -->
          <div v-if="groups.length === 0" class="text-center py-8">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p class="text-gray-500">Create your first group to start splitting expenses with friends.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for the groups list */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
