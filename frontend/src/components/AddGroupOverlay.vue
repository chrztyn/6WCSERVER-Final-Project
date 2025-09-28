<script>
export default {
  name: "AddGroupOverlay",
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'group-created'],
  
  data() {
    return {
      groupName: '',
      activityName: '',
      memberEmails: [''],
      profileImage: null
    };
  },
  
  methods: {
    closeOverlay() {
      this.$emit('close');
    },
    
    resetForm() {
      this.groupName = '';
      this.activityName = '';
      this.memberEmails = [''];
      this.profileImage = null;
    },
    
    addMemberEmail() {
      this.memberEmails.push('');
    },
    
    removeMemberEmail(index) {
      if (this.memberEmails.length > 1) {
        this.memberEmails.splice(index, 1);
      }
    },
    
    handleProfileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.profileImage = file;
      }
    },
    
    saveNewGroup() {
      // Validate form
      if (!this.groupName.trim()) {
        alert('Please enter a group name');
        return;
      }
      
      if (!this.activityName.trim()) {
        alert('Please enter an activity name');
        return;
      }
      
      // Filter out empty emails
      const validEmails = this.memberEmails.filter(email => email.trim());
      
      const newGroup = {
        id: Date.now(), // Simple ID generation
        name: this.groupName.trim(),
        activity: this.activityName.trim(),
        members: validEmails,
        profileImage: this.profileImage
      };
      
      // Debug logging
      console.log('Creating new group:', newGroup);
      console.log('Group name from form:', this.groupName);
      
      this.$emit('group-created', newGroup);
      this.resetForm();
      this.closeOverlay();
    }
  }
};
</script>

<template>
  <!-- Backdrop -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-gray-100 bg-opacity-80 backdrop-blur-sm flex items-center justify-center"
    @click="closeOverlay"
  >
    <!-- Overlay Content -->
    <div 
      class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md mx-4 relative max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-blue-700">Add New Group</h2>
        <button 
          @click="closeOverlay"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Main Content -->
      <div class="bg-gray-50 rounded-lg border border-blue-200 p-6">
        <h3 class="text-xl font-bold text-gray-700 mb-6">Group Details</h3>
        
        <!-- Profile Picture and Group Details -->
        <div class="flex gap-4 mb-6">
          <!-- Profile Picture Upload -->
          <div class="flex-shrink-0">
            <div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
                @click="$refs.profileInput.click()">
              <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1 text-center">Upload Group Profile</p>
            <input 
              ref="profileInput"
              type="file" 
              accept="image/*" 
              @change="handleProfileUpload"
              class="hidden"
            />
          </div>
          
          <!-- Group Details -->
          <div class="flex-1 space-y-3">
            <input 
              v-model="groupName"
              type="text" 
              placeholder="Group Name" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input 
              v-model="activityName"
              type="text" 
              placeholder="Activity Name" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <!-- Member Emails Section -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-700">Add Members</h4>
          
          <div v-for="(email, index) in memberEmails" :key="index" class="flex gap-2">
            <input 
              v-model="memberEmails[index]"
              type="email" 
              placeholder="Member Email" 
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              @click="addMemberEmail"
              class="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </button>
            <button 
              v-if="memberEmails.length > 1"
              @click="removeMemberEmail(index)"
              class="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Save Button -->
        <div class="mt-8 text-center">
          <button 
            @click="saveNewGroup"
            class="button hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg font-medium shadow-md transition-colors"
          >
            Save New Group
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for the overlay */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
