<script>
import axios from 'axios';

export default {
  name: 'TransactionDetailsModal',
  props: {
    transaction: {
      type: Object,
      default: null
    },
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'refresh', 'toast'],
  data() {
    return {
      proofImageUrl: null,
      showProofModal: false,
      processingAction: false,
      showRejectDialog: false,
      rejectReason: ''
    };
  },
  computed: {
    canConfirmOrReject() {
      if (!this.transaction) return false;
      
      const userStr = localStorage.getItem('user');
      console.log('Raw user from localStorage:', userStr);
      
      const user = JSON.parse(userStr || '{}');
      const userId = user._id || user.id;
      
      if (!userId) {
        console.error('User ID is undefined! Check localStorage.');
        return false;
      }
      
      const isPending = this.transaction.status === 'pending';
      const isReceiver = this.transaction.receiver_id?._id === userId;
      const isNotPayer = this.transaction.payer_id?._id !== userId;
      const isPaymentType = this.transaction.transaction_type === 'payment' || 
                           this.transaction.transaction_type === 'settlement';
      
      const result = isPending && isReceiver && isNotPayer && isPaymentType;
      console.log('Can Confirm/Reject:', result);
      
      return result;
    },
    paymentId() {
      console.log('Getting paymentId - source_id:', this.transaction?.source_id);
      console.log('Getting paymentId - related_expense_id (old):', this.transaction?.related_expense_id);
      return this.transaction?.source_id || this.transaction?.related_expense_id;
    }
  },
  methods: {
    async viewProof(paymentId) {
      console.log('viewProof called with paymentId:', paymentId);
      
      if (!paymentId || paymentId === 'undefined') {
        this.showToast('Payment ID not found', 'error');
        console.error('Invalid payment ID:', paymentId);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3001/api/payments/proof/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        
        const contentType = response.headers['content-type'];
        const blob = new Blob([response.data], { type: contentType });
        this.proofImageUrl = URL.createObjectURL(blob);
        this.showProofModal = true;
      } catch (err) {
        this.showToast('Failed to load proof', 'error');
        console.error('Error loading proof:', err);
      }
    },
    
    closeProofModal() {
      this.showProofModal = false;
      if (this.proofImageUrl) {
        URL.revokeObjectURL(this.proofImageUrl);
        this.proofImageUrl = null;
      }
    },
    
    async confirmPayment() {
      if (!this.paymentId) {
        this.showToast('Payment ID not found', 'error');
        console.error('Cannot confirm - paymentId is:', this.paymentId);
        return;
      }
      
      this.processingAction = true;
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `http://localhost:3001/api/payments/${this.paymentId}/confirm`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        this.showToast('Payment confirmed successfully!', 'success');
        this.$emit('refresh');
        this.closeModal();
      } catch (err) {
        this.showToast(err.response?.data?.error || 'Failed to confirm payment', 'error');
        console.error('Error confirming payment:', err);
      } finally {
        this.processingAction = false;
      }
    },
    
    openRejectDialog() {
      this.rejectReason = '';
      this.showRejectDialog = true;
    },
    
    closeRejectDialog() {
      this.showRejectDialog = false;
      this.rejectReason = '';
    },
    
    async rejectPayment() {
      if (!this.paymentId) {
        this.showToast('Payment ID not found', 'error');
        console.error('Cannot reject - paymentId is:', this.paymentId);
        return;
      }
      
      if (!this.rejectReason.trim()) {
        this.showToast('Please provide a reason for rejection', 'error');
        return;
      }
      
      this.processingAction = true;
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `http://localhost:3001/api/payments/${this.paymentId}/reject`,
          { reason: this.rejectReason },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        this.showToast('Payment rejected', 'success');
        this.$emit('refresh');
        this.closeRejectDialog();
        this.closeModal();
      } catch (err) {
        this.showToast(err.response?.data?.error || 'Failed to reject payment', 'error');
        console.error('Error rejecting payment:', err);
      } finally {
        this.processingAction = false;
      }
    },
    
    closeModal() {
      this.closeRejectDialog();
      this.closeProofModal();
      this.$emit('close');
    },
    
    getStatusColor(status) {
      const colors = {
        'confirmed': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'cancelled': 'bg-red-100 text-red-800',
        'rejected': 'bg-red-100 text-red-800'
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
      if (isNaN(amount)) return '₱0.00';
      return `₱${amount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    },
    
    showToast(message, type = 'success') {
      this.$emit('toast', { message, type });
    }
  },
  watch: {
    isOpen(newVal) {
      if (!newVal) {
        this.closeProofModal();
        this.closeRejectDialog();
      }
    },
    transaction: {
      handler(newVal) {
        if (newVal) {
          console.log('Transaction changed:', newVal);
          console.log('Payment ID (source_id):', newVal.source_id);
          console.log('Payment ID (related_expense_id):', newVal.related_expense_id);
        }
      },
      immediate: true
    }
  }
};
</script>

<template>
  <!-- Transaction Details Modal -->
  <div
    v-if="isOpen && transaction"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 class="text-lg sm:text-xl font-semibold text-gray-800">Transaction Details</h3>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
          <span class="text-2xl">×</span>
        </button>
      </div>
      
      <div class="p-4 sm:p-6 space-y-4">
        <!-- Pending Payment Alert -->
        <div v-if="canConfirmOrReject" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <span class="text-2xl">⚠️</span>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-yellow-800 mb-1">Action Required</h4>
              <p class="text-sm text-yellow-700">This payment is pending your confirmation. Please review the details and proof before confirming or rejecting.</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="text-xs sm:text-sm font-medium text-gray-600">Transaction ID</label>
            <p class="text-xs sm:text-sm text-gray-900 font-mono break-all">{{ transaction._id }}</p>
          </div>
          <div>
            <label class="text-xs sm:text-sm font-medium text-gray-600">Type</label>
            <p class="text-sm text-gray-900 capitalize">{{ transaction.transaction_type }}</p>
          </div>
          <div>
            <label class="text-xs sm:text-sm font-medium text-gray-600">Status</label>
            <span
              class="inline-block px-3 py-1 text-xs font-semibold rounded-full mt-1"
              :class="getStatusColor(transaction.status)"
            >
              {{ transaction.status }}
            </span>
          </div>
          <div class="sm:col-span-2">
            <label class="text-xs sm:text-sm font-medium text-gray-600">Amount</label>
            <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ formatCurrency(transaction.amount) }}</p>
          </div>
          <div>
            <label class="text-xs sm:text-sm font-medium text-gray-600">Payer</label>
            <p class="text-sm text-gray-900">{{ transaction.payer_id?.name || 'N/A' }}</p>
            <p class="text-xs text-gray-500">{{ transaction.payer_id?.email || 'N/A' }}</p>
          </div>
          <div v-if="transaction.receiver_id">
            <label class="text-xs sm:text-sm font-medium text-gray-600">Recipient</label>
            <p class="text-sm text-gray-900">{{ transaction.receiver_id?.name || 'N/A' }}</p>
            <p class="text-xs text-gray-500">{{ transaction.receiver_id?.email || 'N/A' }}</p>
          </div>
          <div>
            <label class="text-xs sm:text-sm font-medium text-gray-600">Group</label>
            <p class="text-sm text-gray-900">{{ transaction.group_id?.name || 'N/A' }}</p>
          </div>
          <div>
            <label class="text-xs sm:text-sm font-medium text-gray-600">Date</label>
            <p class="text-sm text-gray-900">{{ formatDate(transaction.transaction_date) }}</p>
          </div>
          <div v-if="transaction.payment_method" class="sm:col-span-2">
            <label class="text-xs sm:text-sm font-medium text-gray-600">Payment Method</label>
            <p class="text-sm text-gray-900">{{ transaction.payment_method }}</p>
          </div>
        </div>
        
        <div>
          <label class="text-xs sm:text-sm font-medium text-gray-600">Description</label>
          <p class="text-sm text-gray-900 mt-1">{{ transaction.description }}</p>
        </div>

        <!-- Proof of Payment -->
        <div v-if="transaction.metadata?.proof_file" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label class="text-sm font-medium text-blue-900 mb-2 block">📎 Proof of Payment</label>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-blue-700">{{ transaction.metadata.proof_file.originalname }}</p>
              <p class="text-xs text-blue-600">{{ (transaction.metadata.proof_file.size / 1024).toFixed(2) }} KB</p>
            </div>
            <button
              @click="viewProof(paymentId)"
              :disabled="!paymentId"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Proof
            </button>
          </div>
        </div>

        <!-- Confirmation Code -->
        <div v-if="transaction.metadata?.confirmation_code" class="bg-gray-50 rounded-lg p-4">
          <label class="text-sm font-medium text-gray-700 mb-2 block">Confirmation Code</label>
          <p class="text-lg font-mono font-bold text-gray-900 bg-white px-4 py-2 rounded border border-gray-300">
            {{ transaction.metadata.confirmation_code }}
          </p>
        </div>
        
        <!-- Settlement Information -->
        <div v-if="transaction.metadata?.original_debt !== undefined" class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <label class="text-sm font-medium text-purple-900 mb-3 block">Settlement Details</label>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-purple-700">Original Debt:</span>
              <span class="font-semibold text-purple-900">{{ formatCurrency(transaction.metadata.original_debt) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-purple-700">Payment Amount:</span>
              <span class="font-semibold text-green-600">{{ formatCurrency(transaction.amount) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-purple-700">Remaining Debt:</span>
              <span class="font-semibold text-purple-900">{{ formatCurrency(transaction.metadata.remaining_debt || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white">
        <div v-if="canConfirmOrReject" class="flex flex-col sm:flex-row gap-3">
          <button
            @click="openRejectDialog"
            :disabled="processingAction"
            class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✗ Reject Payment
          </button>
          <button
            @click="confirmPayment"
            :disabled="processingAction"
            class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ processingAction ? 'Processing...' : '✓ Confirm Payment' }}
          </button>
        </div>
        <button
          v-else
          @click="closeModal"
          class="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
        >
          Close
        </button>
      </div>
    </div>

    <!-- Proof Modal -->
    <div
      v-if="showProofModal"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
      @click="closeProofModal"
    >
      <div class="relative max-w-4xl w-full max-h-[90vh]" @click.stop>
        <button
          @click="closeProofModal"
          class="absolute -top-10 right-0 text-white hover:text-gray-300 text-3xl font-bold"
        >
          ×
        </button>
        <div class="bg-white rounded-lg overflow-hidden">
          <img
            v-if="proofImageUrl"
            :src="proofImageUrl"
            alt="Proof of Payment"
            class="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>
      </div>
    </div>

    <!-- Reject Reason Dialog -->
    <div
      v-if="showRejectDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[55] p-4"
      @click.self="closeRejectDialog"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">Reject Payment</h3>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this payment:</p>
          <textarea
            v-model="rejectReason"
            placeholder="e.g., Incorrect amount, invalid proof, wrong transaction..."
            rows="4"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
          ></textarea>
        </div>
        <div class="p-6 border-t border-gray-200 flex gap-3">
          <button
            @click="rejectPayment"
            :disabled="processingAction || !rejectReason.trim()"
            class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ processingAction ? 'Processing...' : 'Reject Payment' }}
          </button>
          <button
            @click="closeRejectDialog"
            :disabled="processingAction"
            class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>