<script>
import axios from 'axios';

export default {
  name: "Profile",
  data() {
    return {
      user: {
        name: '',
        email: '',
        phone_number: '',
        profile_picture: null,
        payment_methods: []
      },
      originalUser: {},
      isEditing: false,
      isLoading: false,
      error: null,
      successMessage: null,
      selectedFile: null,
      previewImage: null,
      // Payment methods
      showPaymentModal: false,
      editingPaymentIndex: null,
      paymentForm: {
        method_type: 'GCash',
        account_name: '',
        account_number: '',
        qr_code_url: null
      },
      paymentImageFile: null,
      paymentImagePreview: null
    };
  },
  mounted() {
    this.fetchUserProfile();
  },
  methods: {
    async fetchUserProfile() {
      this.isLoading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        this.user = {
          name: response.data.name || '',
          email: response.data.email || '',
          phone_number: response.data.phone_number || '',
          profile_picture: response.data.profile_picture 
            ? `http://localhost:3001${response.data.profile_picture}` 
            : null,
          payment_methods: response.data.payment_methods || []
        };
        this.originalUser = JSON.parse(JSON.stringify(this.user));
        this.updateSidebar();
      } catch (err) {
        this.error = err.response?.data?.msg || 'Failed to load profile';
        console.error('Error fetching profile:', err);
      } finally {
        this.isLoading = false;
      }
    },

    toggleEdit() {
      if (this.isEditing) {
        this.cancelEdit();
      } else {
        this.isEditing = true;
        this.error = null;
        this.successMessage = null;
      }
    },

    cancelEdit() {
      this.user = JSON.parse(JSON.stringify(this.originalUser));
      this.selectedFile = null;
      this.previewImage = null;
      this.isEditing = false;
      this.error = null;
      this.successMessage = null;
    },

    async saveChanges() {
      this.isLoading = true;
      this.error = null;
      this.successMessage = null;

      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();

        if (this.user.name !== this.originalUser.name) {
          formData.append('name', this.user.name);
        }
        if (this.user.phone_number !== this.originalUser.phone_number) {
          formData.append('phone_number', this.user.phone_number);
        }

        // Include payment methods
        formData.append('payment_methods', JSON.stringify(this.user.payment_methods));

        if (this.selectedFile) {
          formData.append('profile_picture', this.selectedFile);
        }

        const response = await axios.put(
          'http://localhost:3001/api/users/profile',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        this.user = {
          name: response.data.user.name,
          email: response.data.user.email,
          phone_number: response.data.user.phone_number || '',
          profile_picture: response.data.user.profile_picture 
            ? `http://localhost:3001${response.data.user.profile_picture}` 
            : null,
          payment_methods: response.data.user.payment_methods || []
        };
        this.originalUser = JSON.parse(JSON.stringify(this.user));
        this.selectedFile = null;
        this.previewImage = null;
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully!';
        this.updateSidebar();

        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      } catch (err) {
        this.error = err.response?.data?.msg || 'Failed to update profile';
        console.error('Error updating profile:', err);
      } finally {
        this.isLoading = false;
      }
    },

    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          this.error = 'Please select an image file';
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.error = 'File size must be less than 5MB';
          return;
        }
        this.selectedFile = file;
        this.previewImage = URL.createObjectURL(file);
        this.error = null;
      }
    },

    async removeProfilePicture() {
      if (!confirm('Are you sure you want to remove your profile picture?')) {
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          'http://localhost:3001/api/users/profile/picture',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        this.user.profile_picture = null;
        this.originalUser.profile_picture = null;
        this.previewImage = null;
        this.selectedFile = null;
        this.successMessage = 'Profile picture removed successfully!';
        this.updateSidebar();

        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      } catch (err) {
        this.error = err.response?.data?.msg || 'Failed to remove profile picture';
        console.error('Error removing profile picture:', err);
      } finally {
        this.isLoading = false;
      }
    },

    updateSidebar() {
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', {
        detail: { profilePicture: this.user.profile_picture }
      }));
    },

    getCurrentProfilePicture() {
      return this.previewImage || this.user.profile_picture;
    },

    // Payment Methods
    openPaymentModal(index = null) {
      this.editingPaymentIndex = index;
      if (index !== null) {
        const payment = this.user.payment_methods[index];
        this.paymentForm = {
          method_type: payment.method_type,
          account_name: payment.account_name,
          account_number: payment.account_number,
          qr_code_url: payment.qr_code_url
        };
      } else {
        this.resetPaymentForm();
      }
      this.showPaymentModal = true;
    },

    closePaymentModal() {
      this.showPaymentModal = false;
      this.editingPaymentIndex = null;
      this.resetPaymentForm();
    },

    resetPaymentForm() {
      this.paymentForm = {
        method_type: 'GCash',
        account_name: '',
        account_number: '',
        qr_code_url: null
      };
      this.paymentImageFile = null;
      this.paymentImagePreview = null;
    },

    handlePaymentImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          this.error = 'Please select an image file for QR code';
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.error = 'File size must be less than 5MB';
          return;
        }
        this.paymentImageFile = file;
        this.paymentImagePreview = URL.createObjectURL(file);
        this.error = null;
      }
    },

    async savePaymentMethod() {
      if (!this.paymentForm.account_name || !this.paymentForm.account_number) {
        this.error = 'Please fill in all required fields';
        return;
      }

      try {
        // If there's a new image, upload it first
        let qrCodeUrl = this.paymentForm.qr_code_url;
        
        if (this.paymentImageFile) {
          const token = localStorage.getItem('token');
          const formData = new FormData();
          formData.append('qr_code', this.paymentImageFile);

          const uploadResponse = await axios.post(
            'http://localhost:3001/api/users/upload-qr',
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          qrCodeUrl = uploadResponse.data.qr_code_url;
        }

        const newPayment = {
          method_type: this.paymentForm.method_type,
          account_name: this.paymentForm.account_name,
          account_number: this.paymentForm.account_number,
          qr_code_url: qrCodeUrl
        };

        if (this.editingPaymentIndex !== null) {
          this.user.payment_methods[this.editingPaymentIndex] = newPayment;
        } else {
          this.user.payment_methods.push(newPayment);
        }

        this.closePaymentModal();
        this.successMessage = `Payment method ${this.editingPaymentIndex !== null ? 'updated' : 'added'} successfully!`;
        
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      } catch (err) {
        this.error = err.response?.data?.msg || 'Failed to save payment method';
        console.error('Error saving payment method:', err);
      }
    },

    removePaymentMethod(index) {
      if (confirm('Are you sure you want to remove this payment method?')) {
        this.user.payment_methods.splice(index, 1);
        this.successMessage = 'Payment method removed successfully!';
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      }
    },

    getQRCodeUrl(url) {
      if (!url) return null;
      return url.startsWith('http') ? url : `http://localhost:3001${url}`;
    }
  }
};
</script>

<template>
  <div class="profile-container">
    <div class="max-w-4xl mx-auto p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[#013DC0] mb-2">Profile</h1>
        <p class="text-gray-600">Manage your account settings and personal information</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !user.email" class="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
        <span>{{ error }}</span>
        <button @click="error = null" class="text-red-700 hover:text-red-900">×</button>
      </div>

      <!-- Success Alert -->
      <div v-if="successMessage" class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
        <span>{{ successMessage }}</span>
        <button @click="successMessage = null" class="text-green-700 hover:text-green-900">×</button>
      </div>

      <!-- Profile Card -->
      <div v-if="!isLoading || user.email" class="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-semibold text-gray-800">Profile Information</h2>
          <button 
            @click="toggleEdit"
            :disabled="isLoading"
            class="flex items-center gap-2 px-4 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/Icons/light add.png" alt="Edit Icon" class="w-4 h-4">
            {{ isEditing ? 'Cancel' : 'Edit' }}
          </button>
        </div>

        <!-- Profile Picture Section -->
        <div class="mb-8">
          <div class="flex items-center gap-6">
            <div class="relative group">
              <div class="w-24 h-24 bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center overflow-hidden transition-all duration-200 hover:border-[#0761FE] hover:shadow-lg">
                <img 
                  v-if="getCurrentProfilePicture()"
                  :src="getCurrentProfilePicture()"
                  alt="Profile Picture"
                  class="w-full h-full object-cover"
                >
                <div v-else class="w-12 h-12 bg-gradient-to-br from-[#0761FE] to-[#013DC0] rounded-full flex items-center justify-center">
                  <span class="text-white font-semibold text-lg">
                    {{ user.name.charAt(0).toUpperCase() || 'U' }}
                  </span>
                </div>
                
                <div v-if="isEditing" class="absolute inset-0 bg-black/50 bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div class="text-white text-center">
                    <img src="/Icons/light add.png" alt="Upload" class="w-6 h-6 mx-auto mb-1 filter brightness-0 invert">
                    <span class="text-xs">Upload</span>
                  </div>
                </div>
              </div>
              
              <input 
                v-if="isEditing"
                type="file"
                accept="image/*"
                @change="handleFileUpload"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                ref="fileInput"
              >
              
              <button 
                v-if="isEditing && (getCurrentProfilePicture() || selectedFile)"
                @click="previewImage ? (previewImage = null, selectedFile = null) : removeProfilePicture()"
                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                type="button"
              >
                <span class="text-xs">×</span>
              </button>
            </div>
            
            <div>
              <h3 class="text-lg font-medium text-gray-800 mb-1">Profile Picture</h3>
              <p class="text-sm text-gray-500 mb-2">
                {{ isEditing ? 'Click to upload a new photo (max 5MB)' : 'Your current profile picture' }}
              </p>
              <div v-if="isEditing" class="flex gap-2">
                <button 
                  @click="$refs.fileInput.click()"
                  class="px-3 py-1 text-xs bg-[#0761FE] text-white rounded hover:bg-[#013DC0] transition-colors"
                  type="button"
                >
                  Choose File
                </button>
                <button 
                  v-if="user.profile_picture && !previewImage"
                  @click="removeProfilePicture"
                  class="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input 
              v-if="isEditing"
              v-model="user.name"
              type="text"
              placeholder="Enter your full name"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent transition-all shadow-sm"
            >
            <div v-else class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
              {{ user.name || 'Not set' }}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input 
              v-if="isEditing"
              v-model="user.phone_number"
              type="tel"
              placeholder="Enter your phone number"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent transition-all shadow-sm"
            >
            <div v-else class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
              {{ user.phone_number || 'Not set' }}
            </div>
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div class="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed">
              {{ user.email }}
            </div>
            <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div v-if="isEditing" class="flex justify-center gap-4">
          <button 
            @click="cancelEdit"
            :disabled="isLoading"
            class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            @click="saveChanges"
            :disabled="isLoading"
            class="px-6 py-3 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="isLoading" class="animate-spin">⟳</span>
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Payment Methods Card -->
      <div v-if="!isLoading || user.email" class="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-semibold text-gray-800 mb-1">Payment Methods</h2>
            <p class="text-sm text-gray-600">Manage your payment methods for transactions</p>
          </div>
          <button 
            v-if="isEditing"
            @click="openPaymentModal()"
            class="flex items-center gap-2 px-4 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors"
          >
            <span class="text-lg">+</span>
            Add Method
          </button>
        </div>

        <!-- Payment Methods List -->
        <div v-if="user.payment_methods.length > 0" class="space-y-4">
          <div 
            v-for="(payment, index) in user.payment_methods" 
            :key="index"
            class="border border-gray-200 rounded-lg p-4 hover:border-[#0761FE] transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex gap-4 flex-1">
                <!-- QR Code Image -->
                <div v-if="payment.qr_code_url" class="flex-shrink-0">
                  <img 
                    :src="getQRCodeUrl(payment.qr_code_url)" 
                    alt="QR Code"
                    class="w-20 h-20 object-cover rounded border border-gray-200"
                  >
                </div>
                <div v-else class="flex-shrink-0 w-20 h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                  <span class="text-gray-400 text-xs">No QR</span>
                </div>

                <!-- Payment Details -->
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {{ payment.method_type }}
                    </span>
                  </div>
                  <p class="text-gray-800 font-medium mb-1">{{ payment.account_name }}</p>
                  <p class="text-gray-600 text-sm">{{ payment.account_number }}</p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div v-if="isEditing" class="flex gap-2 ml-4">
                <button 
                  @click="openPaymentModal(index)"
                  class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
                <button 
                  @click="removePaymentMethod(index)"
                  class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-800 mb-2">No payment methods yet</h3>
          <p class="text-gray-600 mb-4">Add your payment methods to receive payments</p>
          <button 
            v-if="isEditing"
            @click="openPaymentModal()"
            class="px-4 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors"
          >
            Add Payment Method
          </button>
        </div>
      </div>
    </div>

    <!-- Payment Method Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-gray-800">
              {{ editingPaymentIndex !== null ? 'Edit' : 'Add' }} Payment Method
            </h3>
            <button 
              @click="closePaymentModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span class="text-2xl">×</span>
            </button>
          </div>

          <!-- Payment Form -->
          <div class="space-y-4">
            <!-- Method Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select 
                v-model="paymentForm.method_type"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
              >
                <option value="GCash">GCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="PayMaya">PayMaya</option>
                <option value="PayPal">PayPal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Account Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Account Name *</label>
              <input 
                v-model="paymentForm.account_name"
                type="text"
                placeholder="Enter account name"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
              >
            </div>

            <!-- Account Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
              <input 
                v-model="paymentForm.account_number"
                type="text"
                placeholder="Enter account number"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent"
              >
            </div>

            <!-- QR Code Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">QR Code (Optional)</label>
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0761FE] transition-colors">
                <input 
                  type="file"
                  accept="image/*"
                  @change="handlePaymentImageUpload"
                  class="hidden"
                  ref="qrInput"
                >
                
                <div v-if="paymentImagePreview || paymentForm.qr_code_url" class="mb-3">
                  <img 
                    :src="paymentImagePreview || getQRCodeUrl(paymentForm.qr_code_url)" 
                    alt="QR Code Preview"
                    class="w-32 h-32 object-cover mx-auto rounded border border-gray-200"
                  >
                </div>
                
                <button 
                  @click="$refs.qrInput.click()"
                  type="button"
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  {{ paymentImagePreview || paymentForm.qr_code_url ? 'Change QR Code' : 'Upload QR Code' }}
                </button>
                <p class="text-xs text-gray-500 mt-2">Max file size: 5MB</p>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex gap-3 mt-6">
            <button 
              @click="closePaymentModal"
              class="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              @click="savePaymentMethod"
              class="flex-1 px-4 py-3 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors font-medium"
            >
              {{ editingPaymentIndex !== null ? 'Update' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
