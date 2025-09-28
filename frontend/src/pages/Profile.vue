<script>
export default {
  name: "Profile",
  data() {
    return {
      user: {
        name: '',
        email: '',
        phone: '',
        password: '',
        profilePicture: null
      },
      isEditing: false
    };
  },
  methods: {
    toggleEdit() {
      if (this.isEditing) {
        this.resetForm();
      } else {
        this.isEditing = true;
      }
    },
    saveChanges() {
      this.isEditing = false;
    },
    resetForm() {
      this.user = {
        name: '',
        email: '',
        phone: '',
        password: '',
        profilePicture: null
      };
      this.isEditing = false;
      this.updateSidebar();
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          return;
        }
        this.user.profilePicture = URL.createObjectURL(file);
        this.updateSidebar();
      }
    },
    removeProfilePicture() {
      this.user.profilePicture = null;
      this.updateSidebar();
    },
    updateSidebar() {
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', {
        detail: { profilePicture: this.user.profilePicture }
      }));
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

      <!-- Profile Card -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-semibold text-gray-800">Profile Information</h2>
          <button 
            @click="toggleEdit"
            class="flex items-center gap-2 px-4 py-2 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors"
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
                  v-if="user.profilePicture"
                  :src="user.profilePicture"
                  alt="Profile Picture"
                  class="w-full h-full object-cover"
                >
                <div v-else class="w-12 h-12 bg-gradient-to-br from-[#0761FE] to-[#013DC0] rounded-full flex items-center justify-center">
                  <span class="text-white font-semibold text-lg">
                    {{ user.name.charAt(0) || 'U' }}
                  </span>
                </div>
                
                <!-- Upload overlay -->
                <div v-if="isEditing" class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div class="text-white text-center">
                    <img src="/Icons/light add.png" alt="Upload" class="w-6 h-6 mx-auto mb-1">
                    <span class="text-xs">Upload</span>
                  </div>
                </div>
              </div>
              
              <!-- File input -->
              <input 
                v-if="isEditing"
                type="file"
                accept="image/*"
                @change="handleFileUpload"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                ref="fileInput"
              >
              
              <!-- Remove button -->
              <button 
                v-if="isEditing && user.profilePicture"
                @click="removeProfilePicture"
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
                >
                  Choose File
                </button>
                <button 
                  v-if="user.profilePicture"
                  @click="removeProfilePicture"
                  class="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
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
              {{ user.name }}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input 
              v-if="isEditing"
              v-model="user.phone"
              type="tel"
              placeholder="Enter your phone number"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent transition-all shadow-sm"
            >
            <div v-else class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
              {{ user.phone }}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              v-if="isEditing"
              v-model="user.email"
              type="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent transition-all shadow-sm"
            >
            <div v-else class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
              {{ user.email }}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              v-if="isEditing"
              v-model="user.password"
              type="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0761FE] focus:border-transparent transition-all shadow-sm"
            >
            <div v-else class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
              {{ user.password }}
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div v-if="isEditing" class="flex justify-center">
          <button 
            @click="saveChanges"
            class="px-6 py-3 bg-[#0761FE] text-white rounded-lg hover:bg-[#013DC0] transition-colors font-medium shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

input:focus {
  outline: none;
}

button:focus {
  outline: none;
}
</style>