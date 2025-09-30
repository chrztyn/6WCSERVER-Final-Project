<script>
export default {
  name: "SettleDebtForm",
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    selectedDebt: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'debt-settled'],

  data() {
    return {
      loading: false,
      error: null,
      successMessage: null,
      paymentForm: {
        amount: 0,
        payment_method: 'Cash',
        confirmation_code: '',
        proof_file: null
      },
      proofPreview: null,
      formErrors: {
        amount: '',
        confirmation_code: '',
        proof_file: ''
      },
      creditorPaymentMethods: null,
      loadingPaymentMethods: false
    };
  },

  computed: {
    requiresConfirmationCode() {
      return this.paymentForm.payment_method === 'GCash' || this.paymentForm.payment_method === 'Bank';
    },

    allowedFileTypes() {
      return '.jpg,.jpeg,.png,.pdf,.doc,.docx';
    },

    maxFileSize() {
      return 5 * 1024 * 1024; // 5MB
    },

    selectedPaymentMethodDetails() {
      if (!this.creditorPaymentMethods) return null;
      
      const method = this.creditorPaymentMethods.find(
        m => m.method_type === this.paymentForm.payment_method
      );
      
      return method || null;
    }
  },

  watch: {
    isOpen(newVal) {
      if (newVal && this.selectedDebt) {
        this.resetForm();
        this.paymentForm.amount = this.selectedDebt.amount;
        this.fetchCreditorPaymentMethods();
      }
    },

    selectedDebt(newDebt) {
      if (newDebt) {
        this.paymentForm.amount = newDebt.amount;
        this.fetchCreditorPaymentMethods();
      }
    }
  },

  methods: {
    async fetchCreditorPaymentMethods() {
      if (!this.selectedDebt || !this.selectedDebt.creditorId) return;
      
      this.loadingPaymentMethods = true;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/users/${this.selectedDebt.creditorId}/payment-methods`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.creditorPaymentMethods = data.payment_methods || [];
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        this.loadingPaymentMethods = false;
      }
    },

    validateForm() {
      let isValid = true;
      this.formErrors = { amount: '', confirmation_code: '', proof_file: '' };

      if (!this.paymentForm.amount || this.paymentForm.amount <= 0) {
        this.formErrors.amount = 'Amount must be greater than 0';
        isValid = false;
      } else if (this.paymentForm.amount > this.selectedDebt.amount) {
        this.formErrors.amount = 'Amount cannot exceed the total debt';
        isValid = false;
      }

      if (this.requiresConfirmationCode && !this.paymentForm.confirmation_code.trim()) {
        this.formErrors.confirmation_code = 'Confirmation code is required for GCash and Bank transfers';
        isValid = false;
      }

      return isValid;
    },

    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      if (file.size > this.maxFileSize) {
        this.formErrors.proof_file = 'File size must be less than 5MB';
        event.target.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 
                           'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        this.formErrors.proof_file = 'Invalid file type. Please upload JPG, PNG, PDF, or DOC files only.';
        event.target.value = '';
        return;
      }

      this.paymentForm.proof_file = file;
      this.formErrors.proof_file = '';

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.proofPreview = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.proofPreview = null;
      }
    },

    removeFile() {
      this.paymentForm.proof_file = null;
      this.proofPreview = null;
      this.formErrors.proof_file = '';
      
      const fileInput = this.$refs.fileInput;
      if (fileInput) {
        fileInput.value = '';
      }
    },

    async submitSettlement() {
      if (!this.validateForm()) return;

      this.loading = true;
      this.error = null;
      this.successMessage = null;

      try {
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('group_id', this.selectedDebt.groupId);
        formData.append('creditor_name', this.selectedDebt.creditorName);
        formData.append('amount', this.paymentForm.amount);
        formData.append('payment_method', this.paymentForm.payment_method);
        
        if (this.paymentForm.confirmation_code) {
          formData.append('confirmation_code', this.paymentForm.confirmation_code);
        }
        
        if (this.paymentForm.proof_file) {
          formData.append('proof', this.paymentForm.proof_file);
        }

        const response = await fetch('http://localhost:3001/api/payments/settle-debt', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to settle debt');
        }

        const result = await response.json();
        this.successMessage = 'Debt settlement successful!';

        this.$emit('debt-settled', this.selectedDebt, this.paymentForm.amount);

        setTimeout(() => {
          this.closeForm();
        }, 1500);

      } catch (error) {
        console.error('Error settling debt:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    resetForm() {
      this.paymentForm = {
        amount: 0,
        payment_method: 'Cash',
        confirmation_code: '',
        proof_file: null
      };
      this.proofPreview = null;
      this.formErrors = { amount: '', confirmation_code: '', proof_file: '' };
      this.error = null;
      this.successMessage = null;
      this.creditorPaymentMethods = null;
    },

    closeForm() {
      this.resetForm();
      this.$emit('close');
    },

    formatAmount(amount) {
      return `PHP ${parseFloat(amount).toFixed(2)}`;
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    getImageUrl(path) {
      if (!path) return null;
      // Remove leading slash if present
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      return `http://localhost:3001/${cleanPath}`;
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
      class="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
      @click.stop
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-[#0761FE] to-[#013DC0] text-white p-6 sticky top-0 z-10">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">Settle Debt</h2>
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
      <div class="p-6">
        <!-- Success Message -->
        <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {{ successMessage }}
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {{ error }}
        </div>

        <!-- Debt Information -->
        <div v-if="selectedDebt" class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-900 mb-2">Payment Details</h3>
          <div class="space-y-1 text-sm text-gray-600">
            <p><span class="font-medium">Group:</span> {{ selectedDebt.groupName }}</p>
            <p><span class="font-medium">You owe:</span> {{ selectedDebt.creditorName }}</p>
            <p><span class="font-medium">Total debt:</span> {{ formatAmount(selectedDebt.amount) }}</p>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="submitSettlement" class="space-y-4">
          <!-- Amount -->
          <div>
            <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
              Amount to Pay *
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">PHP</span>
              <input
                id="amount"
                v-model.number="paymentForm.amount"
                type="number"
                step="0.01"
                :max="selectedDebt?.amount"
                min="0.01"
                class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors"
                :class="{ 'border-red-500': formErrors.amount }"
                required
              />
            </div>
            <p v-if="formErrors.amount" class="text-red-500 text-sm mt-1">{{ formErrors.amount }}</p>
          </div>

          <!-- Payment Method -->
          <div>
            <label for="paymentMethod" class="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              v-model="paymentForm.payment_method"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors"
              required
            >
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="Bank">Bank Transfer</option>
            </select>
          </div>

          <!-- Payment Method Details (GCash/Bank) -->
          <div v-if="selectedPaymentMethodDetails && (paymentForm.payment_method === 'GCash' || paymentForm.payment_method === 'Bank')" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {{ paymentForm.payment_method }} Payment Information
            </h4>
            
            <div class="space-y-3">
              <!-- Account Name -->
              <div>
                <p class="text-xs text-gray-600 mb-1">Account Name</p>
                <p class="text-sm font-medium text-gray-900">{{ selectedPaymentMethodDetails.account_name }}</p>
              </div>

              <!-- Account Number -->
              <div>
                <p class="text-xs text-gray-600 mb-1">{{ paymentForm.payment_method === 'GCash' ? 'Mobile Number' : 'Account Number' }}</p>
                <p class="text-sm font-medium text-gray-900 font-mono">{{ selectedPaymentMethodDetails.account_number }}</p>
              </div>

              <!-- QR Code -->
              <div v-if="selectedPaymentMethodDetails.qr_code_url" class="mt-3">
                <p class="text-xs text-gray-600 mb-2">Scan QR Code</p>
                <div class="bg-white p-3 rounded-lg border border-gray-300 inline-block">
                  <img 
                    :src="getImageUrl(selectedPaymentMethodDetails.qr_code_url)" 
                    alt="QR Code"
                    class="w-48 h-48 object-contain"
                    @error="(e) => e.target.src = '/placeholder-qr.png'"
                  />
                </div>
              </div>

              <!-- Instructions -->
              <div class="bg-white p-3 rounded-lg border border-blue-200 mt-3">
                <p class="text-xs text-blue-800">
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Send payment to the account above and enter the confirmation/reference code below.
                </p>
              </div>
            </div>
          </div>

          <!-- No Payment Method Available Warning -->
          <div v-else-if="!loadingPaymentMethods && !selectedPaymentMethodDetails && (paymentForm.payment_method === 'GCash' || paymentForm.payment_method === 'Bank')" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-800">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              {{ selectedDebt?.creditorName }} hasn't set up {{ paymentForm.payment_method }} payment details yet.
            </p>
          </div>

          <!-- Confirmation Code -->
          <div v-if="requiresConfirmationCode">
            <label for="confirmationCode" class="block text-sm font-medium text-gray-700 mb-2">
              Confirmation Code *
            </label>
            <input
              id="confirmationCode"
              v-model="paymentForm.confirmation_code"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent outline-none transition-colors"
              :class="{ 'border-red-500': formErrors.confirmation_code }"
              placeholder="Enter transaction reference"
              required
            />
            <p v-if="formErrors.confirmation_code" class="text-red-500 text-sm mt-1">{{ formErrors.confirmation_code }}</p>
          </div>

          <!-- Proof of Payment -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Proof of Payment <span class="text-gray-400">(optional)</span>
            </label>
            
            <!-- File Upload Area -->
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div class="space-y-1 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="flex text-sm text-gray-600">
                  <label class="relative cursor-pointer bg-white rounded-md font-medium text-[#0761FE] hover:text-[#013DC0] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#0761FE]">
                    <span>Upload a file</span>
                    <input 
                      ref="fileInput"
                      type="file" 
                      class="sr-only" 
                      :accept="allowedFileTypes"
                      @change="handleFileUpload"
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">PNG, JPG, PDF, DOC up to 5MB</p>
              </div>
            </div>

            <p v-if="formErrors.proof_file" class="text-red-500 text-sm mt-1">{{ formErrors.proof_file }}</p>

            <!-- File Preview -->
            <div v-if="paymentForm.proof_file" class="mt-3 p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <!-- Image Preview -->
                  <div v-if="proofPreview" class="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                    <img :src="proofPreview" alt="Preview" class="w-full h-full object-cover" />
                  </div>
                  <!-- File Icon for non-images -->
                  <div v-else class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ paymentForm.proof_file.name }}</p>
                    <p class="text-xs text-gray-500">{{ formatFileSize(paymentForm.proof_file.size) }}</p>
                  </div>
                </div>
                
                <button 
                  type="button"
                  @click="removeFile"
                  class="ml-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-4">
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <span v-if="loading">Processing Payment...</span>
              <span v-else>Settle Debt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>