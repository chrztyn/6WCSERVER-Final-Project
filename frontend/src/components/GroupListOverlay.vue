<script>
import GroupItem from './GroupItem.vue';
import CreateGroupForm from './CreateGroupForm.vue';
import ConfirmCardOverlay from '../components/ConfirmCardOverlay.vue';

export default {
  name: "GroupListOverlay",
  components: {
    GroupItem,
    CreateGroupForm,
    ConfirmCardOverlay
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
      groups: [],
      loading: false,
      error: null,
      showCreateForm: false,
      showConfirmOverlay: false,
      groupToLeaveId: null
    };
  },

  watch: {
    // Fetch groups when overlay opens
    isOpen(newVal) {
      if (newVal) {
        this.fetchGroups();
      }
    }
  },

  methods: {
    async fetchGroups() {
      this.loading = true;
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:3001/api/groups/my', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.$router.push('/login');
            return;
          }
          throw new Error(`Failed to fetch groups: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform backend data to match frontend format
        this.groups = data.map(group => ({
          id: group._id,
          name: group.name,
          description: group.description || 'No description',
          created_by: group.created_by,
          members: group.members,
          created_at: group.created_at
        }));

        console.log('Groups loaded:', this.groups);
        
      } catch (error) {
        console.error('Error fetching groups:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async createGroup() {
      // Open the create group form
      this.showCreateForm = true;
    },

    closeCreateForm() {
      this.showCreateForm = false;
    },

    onGroupCreated(newGroup) {
      // Add the new group to the list
      const formattedGroup = {
        id: newGroup._id,
        name: newGroup.name,
        description: newGroup.description || 'No description',
        created_by: newGroup.created_by,
        members: newGroup.members,
        created_at: newGroup.created_at
      };
      
      this.groups.unshift(formattedGroup); // Add to beginning of list
      this.showCreateForm = false;
      
      console.log('New group added to list:', formattedGroup);
    },

    showConfirmLeave(groupId) {
      this.groupToLeaveId = groupId;
      this.showConfirmOverlay = true;
    },

    async confirmLeave() {
      try {
        const groupId = this.groupToLeaveId;
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:3001/api/groups/${groupId}/leave`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to leave group');
        }

        this.groups = this.groups.filter(group => group.id !== groupId);
        console.log('Successfully left the group');

      } catch (error) {
        console.error('Error leaving group:', error);
        alert('Failed to leave group. Please try again.');
      } finally {
        this.closeConfirmOverlay();
      }
    },

    closeConfirmOverlay() {
      this.showConfirmOverlay = false;
      this.groupToLeaveId = null;
    },

    closeOverlay() {
      this.$emit('close');
    },

    selectGroup(group) {
      this.$emit('select-group', group);
      this.closeOverlay();
    },

    leaveGroup(groupId) {
      this.showConfirmLeave(groupId);
    }
  }
};
</script>

<template>
  <!-- Backdrop -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-40 bg-black/50"
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
          <button 
            @click="createGroup"
            class="w-full bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg p-3 font-medium transition-colors mb-4 flex items-center justify-center gap-2"
          >
            <img src="/Icons/light add.png" alt="Add Icon" class="w-5 h-5"> 
            Add New Group
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0761FE]"></div>
          <span class="ml-2 text-gray-600">Loading groups...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error loading groups</h3>
          <p class="text-gray-500 mb-4">{{ error }}</p>
          <button 
            @click="fetchGroups" 
            class="px-4 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors"
          >
            Try Again
          </button>
        </div>

        <!-- Groups List -->
        <div v-else class="flex-1 overflow-y-auto">
          <div v-if="groups.length > 0" class="space-y-3">
            <!-- Individual Group Items -->
            <div 
              v-for="group in groups" 
              :key="group.id"
              class="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0" @click="selectGroup(group)">
                  <h4 class="text-sm font-semibold text-gray-900 truncate">{{ group.name }}</h4>
                  <p class="text-xs text-gray-500 mt-1 truncate">{{ group.description }}</p>
                  <div class="flex items-center mt-2 text-xs text-gray-400">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    {{ group.members?.length || 0 }} members
                  </div>
                </div>
                
                <!-- Leave Group Button -->
                <div class="ml-3 flex-shrink-0">
                  <button 
                    @click.stop="leaveGroup(group.id)"
                    class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Leave Group"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p class="text-gray-500 mb-4">Create your first group to start splitting expenses with friends.</p>
            <button 
              @click="createGroup"
              class="px-6 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Group Form -->
    <CreateGroupForm 
      :isOpen="showCreateForm"
      @close="closeCreateForm"
      @group-created="onGroupCreated"
      class="z-10"
    />

    <!-- Confirmation Overlay -->
    <ConfirmCardOverlay
      :isOpen="showConfirmOverlay"
      title="Leave Group"
      message="Are you sure you want to leave this group? You won't be able to see group expenses or activities anymore."
      confirmText="Leave Group"
      cancelText="Cancel"
      confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
      @confirm="confirmLeave"
      @cancel="closeConfirmOverlay"
    />
  </div>
</template>