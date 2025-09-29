<script>
import SettleDebtForm from './SettleDebtForm.vue';

export default {
  name: "SettleDebtOverlay",
  components: {
    SettleDebtForm
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
      showSettleForm: false,
      selectedDebt: null
    };
  },

  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.fetchDebts();
      }
    }
  },

  computed: {
    filteredDebts() {
      return this.debts.filter(debt => debt.amount > 0.01);
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

            const userDebts = balanceData.summary.filter(debt => 
              debt.Debtor === currentUser.name && debt.Amount > 0.01
            );

            userDebts.forEach(debt => {
              allDebts.push({
                id: `${group._id}_${debt.Creditor}`,
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

    showSettleDebtForm(debt) {
      this.selectedDebt = debt;
      this.showSettleForm = true;
    },

    closeSettleForm() {
      this.showSettleForm = false;
      this.selectedDebt = null;
    },

    onDebtSettled(settledDebt, settledAmount) {
      const debtIndex = this.debts.findIndex(d => d.id === settledDebt.id);
      
      if (debtIndex !== -1) {
        if (this.debts[debtIndex].amount <= settledAmount) {
          this.debts.splice(debtIndex, 1);
        } else {
          this.debts[debtIndex].amount -= settledAmount;
        }
      }

      this.closeSettleForm();
      console.log('Debt settled successfully');
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
                    @click="showSettleDebtForm(debt)"
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">All settled up!</h3>
            <p class="text-gray-500 mb-4">You don't have any outstanding debts to settle.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Settle Debt Form -->
    <SettleDebtForm 
      :isOpen="showSettleForm"
      :selectedDebt="selectedDebt"
      @close="closeSettleForm"
      @debt-settled="onDebtSettled"
    />
  </div>
</template>