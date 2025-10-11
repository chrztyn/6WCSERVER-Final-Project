<script>
export default {
  name: "GroupItem",
  props: {
    group: {
      type: Object,
      required: true,
      default: () => ({
        id: null,
        name: "Group Name",
        activity: "Activity Name",
        members: 0,
        balance: 0
      })
    }
  },
  emits: ['select-group'],
  methods: {
    selectGroup() {
      this.$emit('select-group', this.group);
    }
  }
};
</script>

<template>
  <div 
    class="group-item bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
    @click="selectGroup"
  >
    <div class="flex items-center gap-4">
      <!-- Group Avatar -->
      <div class="w-12 h-12 bg-gradient-to-br from-[#0761FE] to-[#013DC0] rounded-full flex items-center justify-center text-white font-semibold text-lg">
        {{ group.name.charAt(0).toUpperCase() }}
      </div>
      
      <!-- Group Info -->
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 text-lg">{{ group.name }}</h3>
        <p class="text-gray-600 text-sm">{{ group.activity }}</p>
      </div>
      
      <!-- Arrow Icon -->
      <div class="text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-item:hover {
  transform: translateY(-1px);
}
</style>
