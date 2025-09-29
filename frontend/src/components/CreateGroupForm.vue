<script>
export default {
  name: "CreateGroupForm",
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'group-created'],

  data() {
    return {
      loading: false,
      error: null,
      successMessage: null,
      formData: {
        name: '',
        description: '',
        members: [''] // Start with one empty member field
      },
      formErrors: {
        name: '',
        members: []
      }
    };
  },

  methods: {
    // Add a new member email field
    addMemberField() {
      this.formData.members.push('');
    },

    // Remove a member email field
    removeMemberField(index) {
      if (this.formData.members.length > 1) {
        this.formData.members.splice(index, 1);
        if (this.formErrors.members[index]) {
          this.formErrors.members.splice(index, 1);
        }
      }
    },

    // Validate email format
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    // Validate the entire form
    validateForm() {
      let isValid = true;
      this.formErrors = { name: '', members: [] };
      
      // Validate group name
      if (!this.formData.name.trim()) {
        this.formErrors.name = 'Group name is required';
        isValid = false;
      } else if (this.formData.name.length < 3) {
        this.formErrors.name = 'Group name must be at least 3 characters';
        isValid = false;
      }
      
      // Validate member emails
      const validEmails = [];
      this.formData.members.forEach((email, index) => {
        if (email.trim()) {
          if (!this.isValidEmail(email)) {
            this.formErrors.members[index] = 'Please enter a valid email';
            isValid = false;
          } else if (validEmails.includes(email.toLowerCase())) {
            this.formErrors.members[index] = 'This email is already added';
            isValid = false;
          } else {
            validEmails.push(email.toLowerCase());
          }
        }
      });
      
      return isValid;
    },

    // Create the group
    async createGroup() {
      if (!this.validateForm()) return;
      
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Filter out empty member emails
        const validMembers = this.formData.members
          .map(email => email.trim())
          .filter(email => email);

        const requestData = {
          name: this.formData.name.trim(),
          description: this.formData.description.trim(),
          members: validMembers
        };

        console.log('Creating group with data:', requestData);

        const response = await fetch('http://localhost:3001/api/groups', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.$router.push('/login');
            return;
          }
          throw new Error(data.error || `Failed to create group: ${response.status}`);
        }

        this.successMessage = 'Group created successfully!';
        console.log('Group created:', data);
        
        // Emit event to parent component
        this.$emit('group-created', data);
        
        // Close the form after a short delay to show success message
        setTimeout(() => {
          this.closeForm();
        }, 1500);
        
      } catch (error) {
        console.error('Error creating group:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    // Reset form data
    resetForm() {
      this.formData = {
        name: '',
        description: '',
        members: ['']
      };
      this.formErrors = { name: '', members: [] };
      this.error = null;
      this.successMessage = null;
    },

    // Close the form
    closeForm() {
      this.resetForm();
      this.$emit('close');
    }
  },

  watch: {
    // Reset form when opening
    isOpen(newVal) {
      if (newVal) {
        this.resetForm();
      }
    }
  }
};
</script>

<template>
  <!-- Backdrop -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/50"
    @click="closeForm"
  >
    <!-- Form Content -->
    <div 
      class="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
      @click.stop
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-[#0761FE] to-[#013DC0] text-white p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">Create New Group</h2>
          <button 
            @click="closeForm"
            class="text-white hover:text-gray-200 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Form Content -->
      <div class="p-6 h-full flex flex-col">
        <!-- Success Message -->
        <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {{ successMessage }}
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="createGroup" class="flex-1 flex flex-col space-y-6">
          <!-- Group Name -->
          <div>
            <label for="groupName" class="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              id="groupName"
              v-model="formData.name"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors"
              :class="{ 'border-red-500': formErrors.name }"
              placeholder="Enter group name"
              maxlength="50"
            />
            <p v-if="formErrors.name" class="text-red-500 text-sm mt-1">{{ formErrors.name }}</p>
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="3"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors resize-none"
              placeholder="What's this group for?"
              maxlength="200"
            ></textarea>
          </div>

          <!-- Member Emails -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Add Members (Optional)
            </label>
            <p class="text-xs text-gray-500 mb-3">Enter email addresses of people you want to add to the group</p>
            
            <div class="space-y-3 max-h-40 overflow-y-auto">
              <div 
                v-for="(member, index) in formData.members" 
                :key="index"
                class="flex items-center gap-2"
              >
                <input
                  v-model="formData.members[index]"
                  type="email"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors text-sm"
                  :class="{ 'border-red-500': formErrors.members[index] }"
                  placeholder="member@example.com"
                />
                <button
                  type="button"
                  @click="removeMemberField(index)"
                  v-if="formData.members.length > 1"
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Show member errors -->
            <div v-for="(error, index) in formErrors.members" :key="'error-' + index">
              <p v-if="error" class="text-red-500 text-xs mt-1">{{ error }}</p>
            </div>

            <!-- Add Member Button -->
            <button
              type="button"
              @click="addMemberField"
              class="mt-3 w-full border-2 border-dashed border-gray-300 hover:border-[#0761FE] text-gray-600 hover:text-[#0761FE] rounded-lg p-3 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Another Member
            </button>
          </div>

            <!-- Submit Button -->
            <div class="border-t pt-4 mt-auto flex-1">
                <button
                    type="submit"
                    :disabled="loading"
                    class="w-full bg-[#0761FE] hover:bg-[#013DC0] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0761FE] focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                    {{ loading ? 'Creating Group...' : 'Create Group' }}
                </button>
            </div>
        </form>
      </div>
    </div>
  </div>
</template>
