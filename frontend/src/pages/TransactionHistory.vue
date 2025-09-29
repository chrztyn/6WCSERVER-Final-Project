<script>
import axios from 'axios';

export default {
  name: 'TransactionHistory',
  data() {
    return {
      transactions: [],
      stats: null,
      isLoading: false,
      error: null,
      // Pagination
      currentPage: 1,
      totalPages: 1,
      totalTransactions: 0,
      limit: 10,
      // Filters
      filters: {
        transaction_type: '',
        status: '',
        group_id: '',
        start_date: '',
        end_date: ''
      },
      // Available groups for filter
      groups: [],
      // Search
      searchQuery: '',
      // Selected transaction for details modal
      selectedTransaction: null,
      showDetailsModal: false
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
  mounted() {
    this.fetchTransactions();
    this.fetchStats();
    this.fetchGroups();
  },
  methods: {
    async fetchTransactions() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        const params = {
          page: this.currentPage,
          limit: this.limit,
          ...this.filters
        };
        
        // Remove empty filters
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null) {
            delete params[key];
          }
        });
        
        const response = await axios.get('http://localhost:3001/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` },
          params
        });
        
        this.transactions = response.data.transactions;
        this.currentPage = response.data.pagination.current;
        this.totalPages = response.data.pagination.pages;
        this.totalTransactions = response.data.pagination.total;
      } catch (err) {
        console.error('Error fetching transactions:', err);
        this.error = err.response?.data?.error || 'Failed to load transactions';
      } finally {
        this.isLoading = false;
      }
    },
    
    async fetchStats() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/transactions/stats/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        this.stats = response.data.summary;
        console.log(this.stats.total_spent);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    },
    
    async fetchGroups() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/groups/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        this.groups = response.data;
      } catch (err) {
        console.error('Error fetching groups:', err);
      }
    },
    
    applyFilters() {
      this.currentPage = 1;
      this.fetchTransactions();
    },
    
    clearFilters() {
      this.filters = {
        transaction_type: '',
        status: '',
        group_id: '',
        start_date: '',
        end_date: ''
      };
      this.searchQuery = '';
      this.currentPage = 1;
      this.fetchTransactions();
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.fetchTransactions();
      }
    },
    
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.fetchTransactions();
      }
    },
    
    goToPage(page) {
      this.currentPage = page;
      this.fetchTransactions();
    },
    
    async viewDetails(transaction) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3001/api/transactions/${transaction._id}`, {
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
    
    getTransactionIcon(type) {
      const icons = {
        'expense': '💰',
        'payment': '💸',
        'settlement': '🤝'
      };
      return icons[type] || '📌';
    },
    
    getTransactionColor(type) {
      const colors = {
        'expense': 'bg-blue-100 text-blue-600',
        'payment': 'bg-green-100 text-green-600',
        'settlement': 'bg-purple-100 text-purple-600'
      };
      return colors[type] || 'bg-gray-100 text-gray-600';
    },
    
    getStatusColor(status) {
      const colors = {
        'confirmed': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'cancelled': 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatCurrency(amount) {
      return `₱${amount.toFixed(2)}`;
    },
    
    isIncoming(transaction) {
      const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;
      return transaction.receiver_id?._id === userId;
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[#013DC0] mb-2">Transaction History</h1>
        <p class="text-gray-600">View and manage all your financial transactions</p>
      </div>

      <!-- Stats Cards -->
      <div v-if="stats" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Spent</p>
              <p class="text-2xl font-bold text-red-600">{{ formatCurrency(stats.total_spent) }}</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span class="text-2xl">💸</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Received</p>
              <p class="text-2xl font-bold text-green-600">{{ formatCurrency(stats.total_received) }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span class="text-2xl">💰</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Paid</p>
              <p class="text-2xl font-bold text-orange-600">{{ formatCurrency(stats.total_paid) }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span class="text-2xl">💵</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Net Balance</p>
              <p class="text-2xl font-bold" :class="stats.net_balance >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(stats.net_balance) }}
              </p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <!-- Search -->
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by description, person, or group..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
            >
          </div>
          
          <!-- Transaction Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              v-model="filters.transaction_type"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="payment">Payment</option>
              <option value="settlement">Settlement</option>
            </select>
          </div>
          
          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              v-model="filters.status"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <!-- Group -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Group</label>
            <select
              v-model="filters.group_id"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
            >
              <option value="">All Groups</option>
              <option v-for="group in groups" :key="group._id" :value="group._id">
                {{ group.name }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Date Range -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              v-model="filters.start_date"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              v-model="filters.end_date"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
            >
          </div>
        </div>
        
        <!-- Filter Actions -->
        <div class="flex gap-3">
          <button
            @click="applyFilters"
            class="px-6 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors font-medium"
          >
            Apply Filters
          </button>
          <button
            @click="clearFilters"
            class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
        <span>{{ error }}</span>
        <button @click="error = null" class="text-red-700 hover:text-red-900">×</button>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <!-- Loading State -->
        <div v-if="isLoading" class="p-12 text-center">
          <div class="animate-spin w-12 h-12 border-4 border-[#0761FE] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-gray-600">Loading transactions...</p>
        </div>

        <!-- Transactions List -->
        <div v-else-if="filteredTransactions.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From/To</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="transaction in filteredTransactions"
                  :key="transaction._id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <span
                        class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        :class="getTransactionColor(transaction.transaction_type)"
                      >
                        {{ getTransactionIcon(transaction.transaction_type) }}
                      </span>
                      <span class="text-sm font-medium text-gray-900 capitalize">
                        {{ transaction.transaction_type }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-sm text-gray-900 font-medium">{{ transaction.description }}</p>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-600">{{ transaction.group_id?.name || 'N/A' }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm">
                      <p class="text-gray-900">{{ transaction.payer_id?.name || 'N/A' }}</p>
                      <p class="text-gray-500 text-xs" v-if="transaction.receiver_id">
                        → {{ transaction.receiver_id?.name }}
                      </p>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="text-sm font-semibold"
                      :class="isIncoming(transaction) ? 'text-red-600' : 'text-green-600'"
                    >
                      {{ isIncoming(transaction) ? '-' : '+' }}{{ formatCurrency(transaction.amount) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-semibold rounded-full"
                      :class="getStatusColor(transaction.status)"
                    >
                      {{ transaction.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ formatDate(transaction.transaction_date || transaction.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button
                      @click="viewDetails(transaction)"
                      class="text-[#0761FE] hover:text-[#013DC0] text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div class="text-sm text-gray-600">
              Showing {{ (currentPage - 1) * limit + 1 }} to {{ Math.min(currentPage * limit, totalTransactions) }} of {{ totalTransactions }} transactions
            </div>
            <div class="flex gap-2">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                v-for="page in Math.min(totalPages, 5)"
                :key="page"
                @click="goToPage(page)"
                class="px-4 py-2 border rounded-lg text-sm font-medium"
                :class="currentPage === page ? 'bg-[#0761FE] text-white border-[#0761FE]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'"
              >
                {{ page }}
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="p-12 text-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">📝</span>
          </div>
          <h3 class="text-lg font-medium text-gray-800 mb-2">No transactions found</h3>
          <p class="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      </div>
    </div>

    <!-- Transaction Details Modal -->
    <div
      v-if="showDetailsModal && selectedTransaction"
      class="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeDetailsModal"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-xl font-semibold text-gray-800">Transaction Details</h3>
          <button @click="closeDetailsModal" class="text-gray-400 hover:text-gray-600">
            <span class="text-2xl">×</span>
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">Transaction ID</label>
              <p class="text-sm text-gray-900 font-mono">{{ selectedTransaction._id }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Type</label>
              <p class="text-sm text-gray-900 capitalize">{{ selectedTransaction.transaction_type }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Amount</label>
              <p class="text-lg font-bold text-gray-900">{{ formatCurrency(selectedTransaction.amount) }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Status</label>
              <span
                class="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                :class="getStatusColor(selectedTransaction.status)"
              >
                {{ selectedTransaction.status }}
              </span>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Payer</label>
              <p class="text-sm text-gray-900">{{ selectedTransaction.payer_id?.name || 'N/A' }}</p>
              <p class="text-xs text-gray-500">{{ selectedTransaction.payer_id?.email || 'N/A' }}</p>
            </div>
            <div v-if="selectedTransaction.receiver_id">
              <label class="text-sm font-medium text-gray-600">Recipient</label>
              <p class="text-sm text-gray-900">{{ selectedTransaction.receiver_id?.name || 'N/A' }}</p>
              <p class="text-xs text-gray-500">{{ selectedTransaction.receiver_id?.email || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Group</label>
              <p class="text-sm text-gray-900">{{ selectedTransaction.group_id?.name || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Date</label>
              <p class="text-sm text-gray-900">{{ formatDate(selectedTransaction.transaction_date) }}</p>
            </div>
          </div>
          
          <div>
            <label class="text-sm font-medium text-gray-600">Description</label>
            <p class="text-sm text-gray-900 mt-1">{{ selectedTransaction.description }}</p>
          </div>
          
          <div v-if="selectedTransaction.metadata" class="bg-gray-50 rounded-lg p-4">
            <label class="text-sm font-medium text-gray-600 mb-2 block">Additional Information</label>
            <pre class="text-xs text-gray-700 overflow-x-auto">{{ JSON.stringify(selectedTransaction.metadata, null, 2) }}</pre>
          </div>
        </div>
        
        <div class="p-6 border-t border-gray-200 flex justify-end">
          <button
            @click="closeDetailsModal"
            class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
