<script>
import axios from 'axios';
import AddExpenseForm from './AddExpenseForm.vue';
import AddMemberForm from './AddMemberForm.vue';
import ConfirmCardOverlay from '../components/ConfirmCardOverlay.vue';

export default {
  name: "GroupExpenseList",
  components: {
    AddExpenseForm,
    AddMemberForm,
    ConfirmCardOverlay
  },
  data() {
    return {
      group: null,
      expenses: [],
      transactions: [],
      loading: false,
      loadingTransactions: false,
      error: null,
      showAddExpenseForm: false,
      showAddMemberForm: false,
      showConfirmOverlay: false,
      showMembersModal: false,
      expenseToDeleteId: null,
      activeTab: 'expenses',
      showDetailsModal: false,
      selectedTransaction: null,
      currentPage: 1,
      totalPages: 1,
      totalTransactions: 0,
      limit: 10,
      searchQuery: '',
    };
  },
  computed: {
    filteredTransactions() {
      if (!this.searchQuery) return this.transactions;
      
      const query = this.searchQuery.toLowerCase();
      return this.transactions.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.payer_id?.name?.toLowerCase().includes(query) ||
        t.receiver_id?.name?.toLowerCase().includes(query) ||
        t.group_id?.name?.toLowerCase().includes(query)
      );
    }
  },
  created() {
    this.loadGroupData();
    this.loadTransactions();
  },
  watch: {
    '$route.params.id'() {
      this.loadGroupData();
      this.loadTransactions();
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

        const response = await fetch(`/api/expenses/${groupId}`, {
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
          description: data.group.description,
          members: data.group.members || []
        };
        
        this.expenses = data.expenses.map((expense, index) => ({
          id: expense._id || index + 1,
          details: expense.description,
          payor: Array.isArray(expense.payor) 
            ? expense.payor.map(p => p.name).join(', ')
            : expense.payor,
          split_between: expense.split_between || [],
          split_count: expense.split_between ? expense.split_between.length : this.group.members.length,
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

    openMembersModal() {
      this.showMembersModal = true;
    },

    closeMembersModal() {
      this.showMembersModal = false;
    },

    onExpenseAdded(newExpense) {
      console.log('New expense received:', newExpense);
      
      const formattedExpense = {
        id: newExpense._id || this.expenses.length + 1,
        details: newExpense.description,
        payor: Array.isArray(newExpense.paid_by) 
          ? newExpense.paid_by.map(p => p.name).join(', ')
          : 'Unknown',
        split_between: newExpense.split_between || [],
        split_count: newExpense.split_between ? newExpense.split_between.length : this.group.members.length,
        amount: newExpense.amount,
        date: new Date(newExpense.date).toLocaleDateString(),
        status: newExpense.status === 'paid' ? 'all paid' : 'pending'
      };
      
      this.expenses.unshift(formattedExpense);
      this.showAddExpenseForm = false;
      this.loadTransactions();
      
      console.log('New expense added to list:', formattedExpense);
    },

    onMemberAdded() {
      this.loadGroupData();
      this.showAddMemberForm = false;
    },

    showConfirmDelete(expenseId) {
        this.expenseToDeleteId = expenseId;
        this.showConfirmOverlay = true;
    },

    async confirmDelete() {
      try {
          const expenseId = this.expenseToDeleteId;
          const token = localStorage.getItem('token');
          
          const response = await fetch(`/api/expenses/${expenseId}`, {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (!response.ok) {
              throw new Error('Failed to delete expense');
          }

          this.expenses = this.expenses.filter(expense => expense.id !== expenseId);
          this.loadTransactions();
          console.log('Expense deleted successfully');

      } catch (error) {
          console.error('Error deleting expense:', error);
          alert('Failed to delete expense. Please try again.');
      } finally {
          this.closeConfirmOverlay();
      }
    },

    closeConfirmOverlay() {
        this.showConfirmOverlay = false;
        this.expenseToDeleteId = null;
    },
    
    formatAmount(amount) {
      return `₱${parseFloat(amount).toFixed(2)}`;
    },

    getSplitBetweenText(expense) {
      if (!expense.split_between || expense.split_between.length === 0) {
        return `All members (${this.group.members.length})`;
      }
      
      if (expense.split_between.length === this.group.members.length) {
        return `All members (${expense.split_between.length})`;
      }
      
      if (expense.split_between.length <= 3) {
        return expense.split_between.map(member => member.name).join(', ');
      } else {
        return `${expense.split_between.slice(0, 2).map(member => member.name).join(', ')} +${expense.split_between.length - 2} more`;
      }
    },

    getIndividualShare(expense) {
      const splitCount = expense.split_between && expense.split_between.length > 0 
        ? expense.split_between.length 
        : this.group.members.length;
      const shareAmount = expense.amount / splitCount;
      return this.formatAmount(shareAmount);
    },

    getTransactionTypeLabel(type) {
      const labels = {
        'expense': 'Expense',
        'payment': 'Payment',
        'settlement': 'Settlement',
        'group_created': 'Group Created',
        'group_joined': 'Member Joined',
        'group_left': 'Member Left'
      };
      return labels[type] || type;
    },

    getTransactionTypeColor(type) {
      const colors = {
        'expense': 'bg-red-100 text-red-800',
        'payment': 'bg-green-100 text-green-800',
        'settlement': 'bg-blue-100 text-blue-800',
        'group_created': 'bg-purple-100 text-purple-800',
        'group_joined': 'bg-yellow-100 text-yellow-800',
        'group_left': 'bg-gray-100 text-gray-800'
      };
      return colors[type] || 'bg-gray-100 text-gray-800';
    },

    getStatusColor(status) {
      const colors = {
        'confirmed': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'cancelled': 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    },

    async loadTransactions() {
      this.loadingTransactions = true;
      
      try {
        const groupId = this.$route.params.id;
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/transactions/group/${groupId}?limit=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
        }

        const data = await response.json();
        this.transactions = data.transactions.map(transaction => ({
          _id: transaction._id,
          id: transaction._id,
          type: transaction.transaction_type,
          amount: transaction.amount,
          description: transaction.description,
          payer: transaction.payer_id?.name || 'Unknown',
          receiver: transaction.receiver_id?.name || 'N/A',
          date: new Date(transaction.transaction_date).toLocaleDateString(),
          status: transaction.status,
          created_at: transaction.created_at
        }));

        console.log('Transactions loaded:', this.transactions);
        
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        this.loadingTransactions = false;
      }
    },

    async viewDetails(transaction) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/transactions/${transaction._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        this.selectedTransaction = response.data;
        this.showDetailsModal = true;
      } catch (err) {
        console.error('Error fetching transaction details:', err);
        this.error = 'Failed to load transaction details';
      }
    },
    
    closeDetailsModal() {
      this.showDetailsModal = false;
      this.selectedTransaction = null;
    },

    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    formatCurrency(amount) {
      if (isNaN(amount)) return '₱0.00';
      return `₱${amount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Group Header -->
    <div class="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex-1">
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-[#013DC0]">
            {{ group ? group.name : 'Loading...' }}
          </h1>
          <p class="text-sm sm:text-base text-gray-600 mt-1">
            {{ group ? group.description || 'No description' : '' }}
          </p>
          <button
            v-if="group"
            @click="openMembersModal"
            class="mt-2 text-sm text-[#0761FE] hover:text-[#013DC0] font-medium flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            View Members ({{ group.members.length }})
          </button>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-2 sm:gap-3">
          <button 
            @click="openAddMemberForm"
            class="flex-1 sm:flex-none bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span class="hidden sm:inline">Add Member</span>
            <span class="sm:hidden">Member</span>
          </button>
          <button 
            @click="openAddExpenseForm"
            class="flex-1 sm:flex-none bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span class="hidden sm:inline">New Expense</span>
            <span class="sm:hidden">Expense</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 px-4 sm:px-6">
      <div class="flex gap-4">
        <button
          @click="activeTab = 'expenses'"
          :class="[
            'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'expenses'
              ? 'border-[#0761FE] text-[#0761FE]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          Expenses
        </button>
        <button
          @click="activeTab = 'transactions'"
          :class="[
            'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'transactions'
              ? 'border-[#0761FE] text-[#0761FE]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          Recent Transactions
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0761FE]"></div>
      <span class="ml-2 text-gray-600">Loading...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="px-4 sm:px-6 py-6">
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

    <!-- Expenses Tab Content -->
    <div v-else-if="activeTab === 'expenses'" class="px-4 sm:px-6 py-4 sm:py-6">
      <!-- Desktop Table View (lg and above) -->
      <div v-if="expenses.length > 0" class="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">DETAILS</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">PAYOR</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">AMOUNT</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">SPLIT BETWEEN</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">PER PERSON</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">DATE</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900"></th>
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
                <td class="px-6 py-4 text-sm text-gray-600">
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span>{{ getSplitBetweenText(expense) }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                  {{ getIndividualShare(expense) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ expense.date }}
                </td>
                <td class="px-6 py-4 text-right">
                  <button 
                    @click="showConfirmDelete(expense.id)"
                    class="text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Delete expense"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile/Tablet Card View -->
      <div v-if="expenses.length > 0" class="lg:hidden space-y-3">
        <div
          v-for="expense in expenses"
          :key="expense.id"
          class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 text-sm leading-tight">{{ expense.details }}</h3>
              <p class="text-xs text-gray-600 mt-0.5">Paid by {{ expense.payor }}</p>
            </div>
            <button 
              @click="showConfirmDelete(expense.id)"
              class="text-red-500 hover:text-red-700 transition-colors ml-2 flex-shrink-0"
              aria-label="Delete expense"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
          
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p class="text-xs text-gray-500">Total Amount</p>
              <p class="font-semibold text-sm text-[#0761FE]">{{ formatAmount(expense.amount) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Per Person</p>
              <p class="font-semibold text-sm text-gray-900">{{ getIndividualShare(expense) }}</p>
            </div>
          </div>
          
          <div class="flex items-center justify-between pt-2 border-t border-gray-100">
            <div class="flex items-center gap-1 text-xs text-gray-600">
              <svg class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span class="truncate">{{ getSplitBetweenText(expense) }}</span>
            </div>
            <span class="text-xs text-gray-500 ml-2 flex-shrink-0">{{ expense.date }}</span>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
        <p class="text-gray-500 mb-4 text-sm sm:text-base px-4">Add your first expense to start tracking group spending.</p>
        <button 
          @click="openAddExpenseForm"
          class="px-6 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors"
        >
          Add First Expense
        </button>
      </div>
    </div>

    <!-- Transactions Tab Content -->
    <div v-else-if="activeTab === 'transactions'" class="px-4 sm:px-6 py-4 sm:py-6">
      <!-- Loading Transactions -->
      <div v-if="loadingTransactions" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0761FE]"></div>
        <span class="ml-2 text-gray-600">Loading transactions...</span>
      </div>

      <!-- Desktop Transaction Table -->
      <div v-else-if="transactions.length > 0" class="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">TYPE</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">DESCRIPTION</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">FROM</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">TO</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">AMOUNT</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">STATUS</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">DATE</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr 
                v-for="transaction in transactions" 
                :key="transaction.id"
                @click="viewDetails(transaction)"
                class="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td class="px-6 py-4">
                  <span :class="['px-2 py-1 text-xs font-medium rounded-full', getTransactionTypeColor(transaction.type)]">
                    {{ getTransactionTypeLabel(transaction.type) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ transaction.description || 'N/A' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ transaction.payer }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ transaction.receiver }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                  {{ formatAmount(transaction.amount) }}
                </td>
                <td class="px-6 py-4">
                  <span :class="['px-2 py-1 text-xs font-medium rounded-full capitalize', getStatusColor(transaction.status)]">
                    {{ transaction.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ transaction.date }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile Transaction Cards -->
      <div v-if="transactions.length > 0" class="lg:hidden space-y-3">
        <div
          v-for="transaction in transactions"
          :key="transaction.id"
          @click="viewDetails(transaction)"
          class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm transition hover:bg-gray-50 cursor-pointer"
        >
          <!-- Header: Type + Status -->
          <div class="flex items-center justify-between mb-2">
            <span :class="['px-2 py-1 text-xs font-medium rounded-full', getTransactionTypeColor(transaction.type)]">
              {{ getTransactionTypeLabel(transaction.type) }}
            </span>
            <span :class="['px-2 py-1 text-xs font-medium rounded-full capitalize', getStatusColor(transaction.status)]">
              {{ transaction.status }}
            </span>
          </div>

          <!-- Description -->
          <div class="mb-2">
            <p class="text-sm font-semibold text-gray-900 truncate">{{ transaction.description || 'No description' }}</p>
          </div>

          <!-- From / To -->
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p class="text-xs text-gray-500">From</p>
              <p class="font-medium text-sm text-gray-900 truncate">{{ transaction.payer }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">To</p>
              <p class="font-medium text-sm text-gray-900 truncate">{{ transaction.receiver }}</p>
            </div>
          </div>

          <!-- Amount + Date -->
          <div class="flex items-center justify-between pt-2 border-t border-gray-100">
            <p class="font-semibold text-sm text-[#0761FE]">{{ formatAmount(transaction.amount) }}</p>
            <p class="text-xs text-gray-500">{{ transaction.date }}</p>
          </div>
        </div>
      </div>

      <!-- Empty Transactions State -->
      <div v-else class="text-center py-12">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
        <p class="text-gray-500 text-sm sm:text-base px-4">Recent transactions will appear here once expenses or payments are added.</p>
      </div>
    </div>

    <!-- Members Modal -->
    <div
      v-if="showMembersModal"
      class="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeMembersModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">Group Members</h2>
          <button
            @click="closeMembersModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div v-if="group && group.members.length > 0" class="space-y-3">
            <div
              v-for="(member, index) in group.members"
              :key="member._id || index"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div class="w-10 h-10 rounded-full bg-[#0761FE] flex items-center justify-center text-white font-semibold">
                {{ member.name ? member.name.charAt(0).toUpperCase() : '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">{{ member.name }}</p>
                <p class="text-sm text-gray-500 truncate">{{ member.email }}</p>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8">
            <p class="text-gray-500">No members found</p>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t border-gray-200">
          <button
            @click="openAddMemberForm(); closeMembersModal();"
            class="w-full bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add New Member
          </button>
        </div>
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
    
    <ConfirmCardOverlay
        :isOpen="showConfirmOverlay"
        title="Delete Expense"
        message="Are you sure you want to permanently delete this expense? This action cannot be undone."
        @confirm="confirmDelete"
        @cancel="closeConfirmOverlay"
    />

    <!-- Transaction Details Modal -->
    <div
      v-if="showDetailsModal && selectedTransaction"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeDetailsModal"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 class="text-lg sm:text-xl font-semibold text-gray-800">Transaction Details</h3>
          <button @click="closeDetailsModal" class="text-gray-400 hover:text-gray-600">
            <span class="text-2xl">×</span>
          </button>
        </div>
        
        <div class="p-4 sm:p-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="text-xs sm:text-sm font-medium text-gray-600">Transaction ID</label>
              <p class="text-xs sm:text-sm text-gray-900 font-mono break-all">{{ selectedTransaction._id }}</p>
            </div>
            <div>
              <label class="text-xs sm:text-sm font-medium text-gray-600">Type</label>
              <p class="text-sm text-gray-900 capitalize">{{ selectedTransaction.transaction_type }}</p>
            </div>
            <div>
              <label class="text-xs sm:text-sm font-medium text-gray-600">Status</label>
              <span
                class="inline-block px-3 py-1 text-xs font-semibold rounded-full mt-1"
                :class="getStatusColor(selectedTransaction.status)"
              >
                {{ selectedTransaction.status }}
              </span>
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs sm:text-sm font-medium text-gray-600">Amount</label>
              <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ formatCurrency(selectedTransaction.amount) }}</p>
            </div>
            <div>
              <label class="text-xs sm:text-sm font-medium text-gray-600">Payer</label>
              <p class="text-sm text-gray-900">{{ selectedTransaction.payer_id?.name || 'N/A' }}</p>
              <p class="text-xs text-gray-500">{{ selectedTransaction.payer_id?.email || 'N/A' }}</p>
            </div>
            <div v-if="selectedTransaction.receiver_id">
              <label class="text-xs sm:text-sm font-medium text-gray-600">Recipient</label>
              <p class="text-sm text-gray-900">{{ selectedTransaction.receiver_id?.name || 'N/A' }}</p>
              <p class="text-xs text-gray-500">{{ selectedTransaction.receiver_id?.email || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-xs sm:text-sm font-medium text-gray-600">Group</label>
              <p class="text-sm text-gray-900">{{ selectedTransaction.group_id?.name || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-xs sm:text-sm font-medium text-gray-600">Date</label>
              <p class="text-sm text-gray-900">{{ formatDate(selectedTransaction.transaction_date) }}</p>
            </div>
          </div>
          
          <div>
            <label class="text-xs sm:text-sm font-medium text-gray-600">Description</label>
            <p class="text-sm text-gray-900 mt-1">{{ selectedTransaction.description }}</p>
          </div>
          
          <div v-if="selectedTransaction.metadata" class="bg-gray-50 rounded-lg p-3 sm:p-4">
            <label class="text-xs sm:text-sm font-medium text-gray-600 mb-2 block">Additional Information</label>
            <pre class="text-xs text-gray-700 overflow-x-auto">{{ JSON.stringify(selectedTransaction.metadata, null, 2) }}</pre>
          </div>
        </div>
        
        <div class="p-4 sm:p-6 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
          <button
            @click="closeDetailsModal"
            class="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>