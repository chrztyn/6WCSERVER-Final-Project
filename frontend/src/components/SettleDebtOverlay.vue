<script>
import ConfirmCardOverlay from '../components/ConfirmCardOverlay.vue';

export default {
  name: "SettleDebtOverlay",
  components: {
    ConfirmCardOverlay
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],

  data() {
    return {
      debts: [],
      loading: false,
      error: null,
      showConfirmOverlay: false,
      selectedDebt: null,
      paymentForm: {
        amount: 0,
        payment_method: 'Cash',
        confirmation_code: ''
      },
      submittingPayment: false
    };
  },

  watch: {
    // Fetch debts when overlay opens
    isOpen(newVal) {
      if (newVal) {
        this.fetchDebts();
      }
    }
  },

  computed: {
    filteredDebts() {
      return this.debts.filter(debt => debt.amount > 0.01); // Only show debts with meaningful amounts
    },

    requiresConfirmationCode() {
      return this.paymentForm.payment_method === 'GCash' || this.paymentForm.payment_method === 'Bank';
    }
  },

  methods: {
    async fetchDebts() {
      this.loading = true;
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:3001/api/balances/summary/me', {
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
          throw new Error(`Failed to fetch debts: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform the balance data into debt items
        // We need to make another call to get detailed balance information
        await this.fetchDetailedBalances();
        
      } catch (error) {
        console.error('Error fetching debts:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchDetailedBalances() {
      try {
        const token = localStorage.getItem('token');
        const currentUser = JSON.parse(localStorage.getItem('user'));
        
        // Get all groups the user is part of
        const groupsResponse = await fetch('http://localhost:3001/api/groups/my', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!groupsResponse.ok) {
          throw new Error('Failed to fetch groups');
        }

        const groups = await groupsResponse.json();
        let allDebts = [];

        // For each group, fetch balance details
        for (const group of groups) {
          const balanceResponse = await fetch(`http://localhost:3001/api/balances/summary/${group._id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            
            // Filter debts where current user is the debtor
            const userDebts = balanceData.summary.filter(debt => 
              debt.Debtor === currentUser.name && debt.Amount > 0.01
            );

            userDebts.forEach(debt => {
              allDebts.push({
                id: `${group._id}_${debt.Creditor}`, // Create unique ID
                groupId: group._id,
                groupName: group.name,
                creditorName: debt.Creditor,
                amount: debt.Amount,
                currency: 'PHP'
              });
            });
          }
        }

        this.debts = allDebts;
        
      } catch (error) {
        console.error('Error fetching detailed balances:', error);
        this.error = error.message;
      }
    },

    showSettleForm(debt) {
      this.selectedDebt = debt;
      this.paymentForm.amount = debt.amount;
      this.showConfirmOverlay = true;
    },

    closeConfirmOverlay() {
      this.showConfirmOverlay = false;
      this.selectedDebt = null;
      this.resetPaymentForm();
    },

    resetPaymentForm() {
      this.paymentForm = {
        amount: 0,
        payment_method: 'Cash',
        confirmation_code: ''
      };
    },

    async confirmSettlement() {
      if (!this.selectedDebt) return;

      this.submittingPayment = true;
      
      try {
        const token = localStorage.getItem('token');
        
        const paymentData = {
          group_id: this.selectedDebt.groupId,
          creditor_name: this.selectedDebt.creditorName,
          amount: this.paymentForm.amount,
          payment_method: this.paymentForm.payment_method,
          confirmation_code: this.paymentForm.confirmation_code || null
        };

        const response = await fetch('http://localhost:3001/api/payments/settle-debt', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to settle debt');
        }

        const settledAmount = this.paymentForm.amount;
        const debtIndex = this.debts.findIndex(d => d.id === this.selectedDebt.id);
        
        if (debtIndex !== -1) {
          if (this.debts[debtIndex].amount <= settledAmount) {
            this.debts.splice(debtIndex, 1);
          } else {
            this.debts[debtIndex].amount -= settledAmount;
          }
        }

        console.log('Debt settlement successful');
        
      } catch (error) {
        console.error('Error settling debt:', error);
        alert(`Failed to settle debt: ${error.message}`);
      } finally {
        this.submittingPayment = false;
        this.closeConfirmOverlay();
      }
    },

    closeOverlay() {
      this.$emit('close');
    },

    formatAmount(amount) {
      return `PHP ${parseFloat(amount).toFixed(2)}`;
    }
  }
};
</script>

<template>
  <!-- Backdrop -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-40"
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
          <h2 class="text-2xl font-bold">Settle Debts</h2>
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
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Outstanding Debts</h3>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0761FE]"></div>
          <span class="ml-2 text-gray-600">Loading debts...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error loading debts</h3>
          <p class="text-gray-500 mb-4">{{ error }}</p>
          <button 
            @click="fetchDebts" 
            class="px-4 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors"
          >
            Try Again
          </button>
        </div>

        <!-- Debts List -->
        <div v-else class="flex-1 overflow-y-auto">
          <div v-if="filteredDebts.length > 0" class="space-y-3">
            <!-- Individual Debt Items -->
            <div 
              v-for="debt in filteredDebts" 
              :key="debt.id"
              class="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-semibold text-gray-900">{{ debt.groupName }}</h4>
                  <p class="text-xs text-gray-500 mt-1">You owe {{ debt.creditorName }}</p>
                  <div class="flex items-center mt-2">
                    <span class="text-lg font-bold text-red-600">{{ formatAmount(debt.amount) }}</span>
                  </div>
                </div>
                
                <!-- Settle Button -->
                <div class="ml-3 flex-shrink-0">
                  <button 
                    @click="showSettleForm(debt)"
                    class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Settle
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">All settled up!</h3>
            <p class="text-gray-500 mb-4">You don't have any outstanding debts to settle.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Settlement Form Overlay -->
    <ConfirmCardOverlay
      :isOpen="showConfirmOverlay"
      :title="`Settle Debt with ${selectedDebt?.creditorName || ''}`"
      :showInput="true"
      @confirm="confirmSettlement"
      @cancel="closeConfirmOverlay"
    >
      <template #content>
        <div v-if="selectedDebt" class="space-y-4">
          <!-- Debt Info -->
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-sm text-gray-600">Group: {{ selectedDebt.groupName }}</p>
            <p class="text-sm text-gray-600">You owe: {{ formatAmount(selectedDebt.amount) }}</p>
          </div>

          <!-- Payment Amount -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount to Pay</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">PHP</span>
              <input
                v-model.number="paymentForm.amount"
                type="number"
                step="0.01"
                :max="selectedDebt.amount"
                class="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
                required
              />
            </div>
          </div>

          <!-- Payment Method -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              v-model="paymentForm.payment_method"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
              required
            >
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="Bank">Bank Transfer</option>
            </select>
          </div>

          <!-- Confirmation Code (for GCash/Bank) -->
          <div v-if="requiresConfirmationCode">
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
            <input
              v-model="paymentForm.confirmation_code"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
              placeholder="Enter transaction reference"
              required
            />
          </div>

          <!-- Loading State -->
          <div v-if="submittingPayment" class="flex items-center justify-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0761FE]"></div>
            <span class="ml-2 text-gray-600">Processing payment...</span>
          </div>
        </div>
      </template>
    </ConfirmCardOverlay>
  </div>
</template>