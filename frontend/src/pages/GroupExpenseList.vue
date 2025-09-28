<script>
// GroupExpenseList.vue
import AddExpenseForm from './AddExpenseForm.vue';
import AddMemberForm from './AddMemberForm.vue';

export default {
  name: "GroupExpenseList",
  components: {
    AddExpenseForm,
    AddMemberForm
  },
  data() {
    return {
      group: null,
      expenses: [],
      loading: false,
      error: null,
      showAddExpenseForm: false,
      showAddMemberForm: false
    };
  },
  created() {
    this.loadGroupData();
  },
  watch: {
    '$route.params.id'() {
      this.loadGroupData();
    }
  },
  methods: {
    async loadGroupData() {
      this.loading = true;
      this.error = null;
      
      try {
        const groupId = this.$route.params.id;
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch expenses for this group
        const response = await fetch(`http://localhost:3001/api/expenses/${groupId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.$router.push('/login');
            return;
          }
          throw new Error(`Failed to fetch group data: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw API response:', data);
        
        this.group = {
          id: groupId,
          name: data.group.name,
          description: data.group.description
        };
        
        this.expenses = data.expenses.map((expense, index) => ({
          id: expense._id || index + 1,
          details: expense.description,
          payor: Array.isArray(expense.payor) 
            ? expense.payor.map(p => p.name).join(', ')
            : expense.payor,
          amount: expense.amount,
          date: new Date(expense.date).toLocaleDateString(),
          status: expense.status === 'paid' ? 'all paid' : 'pending'
        }));

        console.log('Group data loaded:', this.group);
        console.log('Expenses loaded:', this.expenses);
        
      } catch (error) {
        console.error('Error loading group data:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    openAddExpenseForm() {
      this.showAddExpenseForm = true;
    },

    closeAddExpenseForm() {
      this.showAddExpenseForm = false;
    },

    openAddMemberForm() {
      this.showAddMemberForm = true;
    },

    closeAddMemberForm() {
      this.showAddMemberForm = false;
    },

    onExpenseAdded(newExpense) {
      console.log('New expense received:', newExpense);
      
      const formattedExpense = {
        id: newExpense._id || this.expenses.length + 1,
        details: newExpense.description,
        payor: Array.isArray(newExpense.paid_by) 
          ? newExpense.paid_by.map(p => p.name).join(', ')
          : 'Unknown', // Fallback if payor data is missing
        amount: newExpense.amount,
        date: new Date(newExpense.date).toLocaleDateString(),
        status: newExpense.status === 'paid' ? 'all paid' : 'pending'
      };
      
      this.expenses.unshift(formattedExpense); // Add to beginning
      this.showAddExpenseForm = false;
      
      console.log('New expense added to list:', formattedExpense);
    },

    onMemberAdded() {
      this.loadGroupData();
      this.showAddMemberForm = false;
    },

    getStatusClass(status) {
      switch (status) {
        case 'all paid':
          return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium';
        default:
          return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
      }
    },
    
    formatAmount(amount) {
      return `PHP ${parseFloat(amount).toFixed(2)}`;
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Group Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-[#013DC0]">
            {{ group ? group.name : 'Loading...' }}
          </h1>
          <p class="text-lg text-gray-600 mt-1">
            {{ group ? group.description || 'No description' : '' }}
          </p>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button 
            @click="openAddMemberForm"
            class="bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg p-3 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Add Member
          </button>
          <button 
            @click="openAddExpenseForm"
            class="bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg p-3 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Expense
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0761FE]"></div>
      <span class="ml-2 text-gray-600">Loading group data...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="px-6 py-6">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        <p class="font-medium">Error loading group data</p>
        <p class="text-sm mt-1">{{ error }}</p>
        <button 
          @click="loadGroupData"
          class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>

    <!-- Expense Table -->
    <div v-else class="px-6 py-6">
      <div v-if="expenses.length > 0" class="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">DETAILS</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">PAYOR</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">AMOUNT</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">DATE</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">STATUS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr 
              v-for="expense in expenses" 
              :key="expense.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                {{ expense.details }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ expense.payor }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                {{ formatAmount(expense.amount) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ expense.date }}
              </td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(expense.status)">
                  {{ expense.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
        <p class="text-gray-500 mb-4">Add your first expense to start tracking group spending.</p>
        <button 
          @click="openAddExpenseForm"
          class="px-6 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors"
        >
          Add First Expense
        </button>
      </div>
    </div>

    <!-- Add Expense Form -->
    <AddExpenseForm 
      :isOpen="showAddExpenseForm"
      :groupId="$route.params.id"
      @close="closeAddExpenseForm"
      @expense-added="onExpenseAdded"
    />

    <!-- Add Member Form -->
    <AddMemberForm 
      :isOpen="showAddMemberForm"
      :groupId="$route.params.id"
      @close="closeAddMemberForm"
      @member-added="onMemberAdded"
    />
  </div>
</template>