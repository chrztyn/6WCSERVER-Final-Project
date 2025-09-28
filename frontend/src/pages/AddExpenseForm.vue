<script>
// AddExpenseForm.vue
export default {
  name: "AddExpenseForm",
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
  emits: ['close', 'expense-added'],

  data() {
    return {
      loading: false,
      error: null,
      successMessage: null,
      formData: {
        description: '',
        amount: '',
        paid_by: [''], 
        date: '',
        status: 'pending'
      },
      formErrors: {
        description: '',
        amount: '',
        paid_by: []
      }
    };
  },

  methods: {
    // Add a new payor email field
    addPayorField() {
      this.formData.paid_by.push('');
    },

    // Remove a payor email field
    removePayorField(index) {
      if (this.formData.paid_by.length > 1) {
        this.formData.paid_by.splice(index, 1);
        if (this.formErrors.paid_by[index]) {
          this.formErrors.paid_by.splice(index, 1);
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
      this.formErrors = { description: '', amount: '', paid_by: [] };
      
      // Validate description
      if (!this.formData.description.trim()) {
        this.formErrors.description = 'Description is required';
        isValid = false;
      }
      
      // Validate amount
      if (!this.formData.amount || this.formData.amount <= 0) {
        this.formErrors.amount = 'Please enter a valid amount';
        isValid = false;
      }
      
      // Validate payor emails
      const validEmails = [];
      this.formData.paid_by.forEach((email, index) => {
        if (email.trim()) {
          if (!this.isValidEmail(email)) {
            this.formErrors.paid_by[index] = 'Please enter a valid email';
            isValid = false;
          } else if (validEmails.includes(email.toLowerCase())) {
            this.formErrors.paid_by[index] = 'This email is already added';
            isValid = false;
          } else {
            validEmails.push(email.toLowerCase());
          }
        }
      });

      if (validEmails.length === 0) {
        this.formErrors.paid_by[0] = 'At least one payor is required';
        isValid = false;
      }
      
      return isValid;
    },

    // Add expense - FIXED
    async addExpense() {
      if (!this.validateForm()) return;
      
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Filter out empty payor emails
        const validPayors = this.formData.paid_by
          .map(email => email.trim())
          .filter(email => email);

        const requestData = {
          description: this.formData.description.trim(),
          amount: parseFloat(this.formData.amount),
          paid_by: validPayors,
          date: this.formData.date || undefined,
          status: this.formData.status
        };

        console.log('Adding expense with data:', requestData);

        // Fixed: Use relative URL instead of hardcoded localhost
        const response = await fetch(`http://localhost:3001/api/expenses/${this.groupId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        const data = await response.json();
        console.log('Full API response:', data);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.$router.push('/login');
            return;
          }
          throw new Error(data.msg || data.error || `Failed to add expense: ${response.status}`);
        }

        this.successMessage = 'Expense added successfully!';
        console.log('Expense added successfully:', data);
        
        // Emit event to parent component with the correct data structure
        this.$emit('expense-added', data.expense);
        
        // Close the form after a short delay to show success message
        setTimeout(() => {
          this.closeForm();
        }, 1500);
        
      } catch (error) {
        console.error('Error adding expense:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    // Reset form data
    resetForm() {
      this.formData = {
        description: '',
        amount: '',
        paid_by: [''],
        date: '',
        status: 'pending'
      };
      this.formErrors = { description: '', amount: '', paid_by: [] };
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
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        this.formData.date = today;
      }
    }
  }
};
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
          <h2 class="text-2xl font-bold">Add New Expense</h2>
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
      <div class="p-6 h-full flex flex-col overflow-y-auto">
        <!-- Success Message -->
        <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {{ successMessage }}
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="addExpense" class="flex-1 flex flex-col space-y-6">
          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              id="description"
              v-model="formData.description"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors"
              :class="{ 'border-red-500': formErrors.description }"
              placeholder="What was this expense for?"
              maxlength="100"
            />
            <p v-if="formErrors.description" class="text-red-500 text-sm mt-1">{{ formErrors.description }}</p>
          </div>

          <!-- Amount -->
          <div>
            <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
              Amount (PHP) *
            </label>
            <input
              id="amount"
              v-model="formData.amount"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors"
              :class="{ 'border-red-500': formErrors.amount }"
              placeholder="0.00"
            />
            <p v-if="formErrors.amount" class="text-red-500 text-sm mt-1">{{ formErrors.amount }}</p>
          </div>

          <!-- Date -->
          <div>
            <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              id="date"
              v-model="formData.date"
              type="date"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors"
            />
          </div>

          <!-- Status -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              v-model="formData.status"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <!-- Payor Emails -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Who Paid? *
            </label>
            <p class="text-xs text-gray-500 mb-3">Enter email addresses of people who paid for this expense</p>
            
            <div class="space-y-3 max-h-32 overflow-y-auto">
              <div 
                v-for="(payor, index) in formData.paid_by" 
                :key="index"
                class="flex items-center gap-2"
              >
                <input
                  v-model="formData.paid_by[index]"
                  type="email"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors text-sm"
                  :class="{ 'border-red-500': formErrors.paid_by[index] }"
                  placeholder="payor@example.com"
                />
                <button
                  type="button"
                  @click="removePayorField(index)"
                  v-if="formData.paid_by.length > 1"
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Show payor errors -->
            <div v-for="(error, index) in formErrors.paid_by" :key="'error-' + index">
              <p v-if="error" class="text-red-500 text-xs mt-1">{{ error }}</p>
            </div>

            <!-- Add Payor Button -->
            <button
              type="button"
              @click="addPayorField"
              class="mt-3 w-full border-2 border-dashed border-gray-300 hover:border-[#0761FE] text-gray-600 hover:text-[#0761FE] rounded-lg p-3 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Another Payor
            </button>
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
              {{ loading ? 'Adding Expense...' : 'Add Expense' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>