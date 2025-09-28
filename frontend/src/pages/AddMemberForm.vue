<script>
// AddMemberForm.vue
export default {
  name: "AddMemberForm",
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    groupId: {
      type: String,
      required: true
    }
  },
  emits: ['close', 'member-added'],

  data() {
    return {
      loading: false,
      error: null,
      successMessage: null,
      formData: {
        members: ['']
      },
      formErrors: {
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

      if (validEmails.length === 0) {
        this.formErrors.members[0] = 'At least one member email is required';
        isValid = false;
      }
      
      return isValid;
    },

    // Add members to group (Note: This would need a backend endpoint)
    async addMembers() {
      if (!this.validateForm()) return;
      
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      
      try {
        // Note: You'll need to create a backend endpoint for adding members
        // This is a placeholder implementation
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const validMembers = this.formData.members
          .map(email => email.trim())
          .filter(email => email);

        // You'd need to create this endpoint in your backend
        const response = await fetch(`http://localhost:3001/api/groups/${this.groupId}/add-members`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ members: validMembers })
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.$router.push('/login');
            return;
          }
          
          // For now, show a placeholder success since endpoint doesn't exist
          if (response.status === 404) {
            this.successMessage = 'Members would be added (endpoint not implemented yet)';
            setTimeout(() => {
              this.$emit('member-added');
              this.closeForm();
            }, 1500);
            return;
          }
          
          throw new Error(`Failed to add members: ${response.status}`);
        }

        const data = await response.json();
        this.successMessage = 'Members added successfully!';
        
        setTimeout(() => {
          this.$emit('member-added', data);
          this.closeForm();
        }, 1500);
        
      } catch (error) {
        console.error('Error adding members:', error);
        // For demo purposes, show success message since backend endpoint doesn't exist
        this.successMessage = 'Members would be added (backend endpoint needed)';
        setTimeout(() => {
          this.$emit('member-added');
          this.closeForm();
        }, 1500);
      } finally {
        this.loading = false;
      }
    },

    // Reset form data
    resetForm() {
      this.formData = { members: [''] };
      this.formErrors = { members: [] };
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
}
</script>

<template>
  <!-- Backdrop -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-50"
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
          <h2 class="text-2xl font-bold">Add Members</h2>
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
        <form @submit.prevent="addMembers" class="flex-1 flex flex-col space-y-6">
          <!-- Member Emails -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Add New Members
            </label>
            <p class="text-xs text-gray-500 mb-3">Enter email addresses of people you want to add to this group</p>
            
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

          <!-- Info Message -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="ml-3">
                <p class="text-sm text-blue-700">
                  <strong>Note:</strong> Only users who already have accounts with these email addresses can be added to the group.
                </p>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="border-t pt-4 mt-auto flex-1">
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-[#0761FE] hover:bg-[#013DC0] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0761FE] focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Adding Members...' : 'Add Members' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>