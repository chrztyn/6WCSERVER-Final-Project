<script>
import groupService from '@/services/groupService';

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
      groupMembers: [],
      formData: {
        description: '',
        amount: '',
        paid_by: [],
        split_between: [],
        date: '',
        status: 'pending'
      },
      splitAllMembers: true,
      formErrors: {
        description: '',
        amount: '',
        paid_by: '',
        split_between: ''
      }
    };
  },

  computed: {
    canSubmit() {
      return (
        this.formData.description.trim() &&
        this.formData.amount > 0 &&
        this.formData.paid_by.length > 0 &&
        (this.splitAllMembers || this.formData.split_between.length > 0)
      );
    }
  },

  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.loadGroupMembers();
        this.resetForm();
        const today = new Date().toISOString().split('T')[0];
        this.formData.date = today;
      }
    }
  },

  methods: {
    async loadGroupMembers() {
      try {
        this.error = null;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          this.error = 'No authentication token found';
          return;
        }

        const groups = await groupService.getMyGroups();
        const currentGroup = groups.find(g => g._id === this.groupId);
        
        if (currentGroup && currentGroup.members) {
          this.groupMembers = currentGroup.members;
          console.log('Loaded group members:', this.groupMembers);
        } else {
          const response = await fetch(`http://localhost:3001/api/groups/${this.groupId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to load group: ${response.status}`);
          }

          const data = await response.json();
          this.groupMembers = data.group?.members || [];
          console.log('Loaded group members (fallback):', this.groupMembers);
        }

        if (this.groupMembers.length === 0) {
          this.error = 'No members found in this group';
        }

      } catch (error) {
        console.error('Error loading group members:', error);
        this.error = 'Failed to load group members. Please try again.';
        this.groupMembers = [];
      }
    },

    toggleAllMembers() {
      if (this.splitAllMembers) {
        this.formData.split_between = [];
      }
    },

    validateForm() {
      let isValid = true;
      this.formErrors = { description: '', amount: '', paid_by: '', split_between: '' };
      
      if (!this.formData.description.trim()) {
        this.formErrors.description = 'Description is required';
        isValid = false;
      }
      
      if (!this.formData.amount || this.formData.amount <= 0) {
        this.formErrors.amount = 'Please enter a valid amount';
        isValid = false;
      }
      
      if (this.formData.paid_by.length === 0) {
        this.formErrors.paid_by = 'At least one person must be selected as payor';
        isValid = false;
      }

      if (!this.splitAllMembers && this.formData.split_between.length === 0) {
        this.formErrors.split_between = 'Select at least one member to split between';
        isValid = false;
      }
      
      return isValid;
    },

    async addExpense() {
      if (!this.validateForm()) return;
      
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const requestData = {
          description: this.formData.description.trim(),
          amount: parseFloat(this.formData.amount),
          paid_by: this.formData.paid_by,
          split_between: this.splitAllMembers ? [] : this.formData.split_between,
          date: this.formData.date || undefined,
          status: this.formData.status
        };

        console.log('Adding expense with data:', requestData);

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
            sessionStorage.removeItem('token');
            this.$router.push('/login');
            return;
          }
          throw new Error(data.msg || data.error || `Failed to add expense: ${response.status}`);
        }

        this.successMessage = 'Expense added successfully!';
        console.log('Expense added successfully:', data);
        
        this.$emit('expense-added', data.expense);
        
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

    resetForm() {
      this.formData = {
        description: '',
        amount: '',
        paid_by: [],
        split_between: [],
        date: '',
        status: 'pending'
      };
      this.splitAllMembers = true;
      this.formErrors = { description: '', amount: '', paid_by: '', split_between: '' };
      this.error = null;
      this.successMessage = null;
    },

    closeForm() {
      this.resetForm();
      this.$emit('close');
    }
  }
};
</script>

<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 z-50"
    @click="closeForm"
  >
    <div 
      class="fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
      @click.stop
    >
      <div class="bg-gradient-to-r from-[#0761FE] to-[#013DC0] text-white p-6 sticky top-0 z-10">
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

      <div class="p-6">
        <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {{ successMessage }}
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="addExpense" class="space-y-6">
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Who Paid? *
            </label>
            <div v-if="groupMembers.length > 0" class="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
              <div v-for="member in groupMembers" :key="member._id" class="flex items-center">
                <input
                  :id="`payor-${member._id}`"
                  v-model="formData.paid_by"
                  :value="member.email"
                  type="checkbox"
                  class="w-4 h-4 text-[#0761FE] border-gray-300 rounded focus:ring-[#0761FE]"
                />
                <label :for="`payor-${member._id}`" class="ml-3 text-sm text-gray-700 cursor-pointer">
                  {{ member.name }}
                  <span class="text-gray-500 text-xs">({{ member.email }})</span>
                </label>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">
              Loading members...
            </div>
            <p v-if="formErrors.paid_by" class="text-red-500 text-sm mt-1">{{ formErrors.paid_by }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formData.paid_by.length }} person(s) selected</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Split Between *
            </label>
            
            <div class="flex items-center mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                id="split-all"
                v-model="splitAllMembers"
                type="checkbox"
                class="w-4 h-4 text-[#0761FE] border-gray-300 rounded focus:ring-[#0761FE]"
                @change="toggleAllMembers"
              />
              <label for="split-all" class="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                Split between all group members ({{ groupMembers.length }})
              </label>
            </div>

            <div v-if="!splitAllMembers">
              <div v-if="groupMembers.length > 0" class="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div v-for="member in groupMembers" :key="member._id" class="flex items-center">
                  <input
                    :id="`split-${member._id}`"
                    v-model="formData.split_between"
                    :value="member.email"
                    type="checkbox"
                    class="w-4 h-4 text-[#0761FE] border-gray-300 rounded focus:ring-[#0761FE]"
                  />
                  <label :for="`split-${member._id}`" class="ml-3 text-sm text-gray-700 cursor-pointer">
                    {{ member.name }}
                    <span class="text-gray-500 text-xs">({{ member.email }})</span>
                  </label>
                </div>
              </div>
              <p v-if="formErrors.split_between" class="text-red-500 text-sm mt-1">{{ formErrors.split_between }}</p>
              <p class="text-xs text-gray-500 mt-1">
                {{ formData.split_between.length }} member(s) selected
              </p>
            </div>

            <p v-if="splitAllMembers" class="text-xs text-gray-500 mt-1">
              Expense will be split equally between all {{ groupMembers.length }} group members
            </p>
          </div>

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

          <div class="border-t pt-4 sticky bottom-0 bg-white">
            <button
              type="submit"
              :disabled="loading || !canSubmit"
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