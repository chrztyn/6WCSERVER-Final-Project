<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router';

// Initialize the router
const router = useRouter()

defineOptions({
    name: 'Login'
});

// Form state management
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Form data
const loginForm = reactive({
  email: '',
  password: ''
})

// Form validation
const loginErrors = reactive({
  email: '',
  password: ''
})

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateLoginForm = () => {
  let isValid = true
  
  // Reset errors
  Object.keys(loginErrors).forEach(key => loginErrors[key] = '')
  
  if (!loginForm.email) {
    loginErrors.email = 'Email is required'
    isValid = false
  } else if (!validateEmail(loginForm.email)) {
    loginErrors.email = 'Please enter a valid email'
    isValid = false
  }
  
  if (!loginForm.password) {
    loginErrors.password = 'Password is required'
    isValid = false
  }
  
  return isValid
}

// API call
const handleLogin = async () => {
  if (!validateLoginForm()) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: loginForm.email,
        password: loginForm.password
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      // Store JWT token
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      successMessage.value = 'Login successful!'
      // Redirect to dashboard or emit event to parent component
      console.log('Login successful:', data.user)
      // You can add router navigation here:
      router.push('/dashboard')
    } else {
      errorMessage.value = data.message || 'Login failed'
    }
  } catch (error) {
    errorMessage.value = 'Network error. Please try again.'
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}

</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EDF5FB] to-[#f8fafc] p-4 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-30">
      <div
        class="absolute inset-0"
        style="background-image: radial-gradient(circle at 1px 1px, #0761FE 1px, transparent 0); background-size: 20px 20px;"
      ></div>
    </div>
    
    <!-- Subtle Top Gradient -->
    <div class="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-[#0761FE]/8 to-transparent"></div>
    
    <!-- Subtle Bottom Gradient -->
    <div class="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#07CAFC]/6 to-transparent"></div>

    <div class="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      <!-- Header -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p class="text-gray-600 font-medium">Sign in to your account</p>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="errorMessage" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
        <div class="flex items-center">
          <div class="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
          {{ errorMessage }}
        </div>
      </div>
      
      <div v-if="successMessage" class="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
        <div class="flex items-center">
          <div class="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
          {{ successMessage }}
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-semibold text-[#013DC0] mb-3">Email Address</label>
          <input
            id="email"
            v-model="loginForm.email"
            type="email"
            class="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0761FE] focus:border-[#0761FE] outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
            :class="{ 'border-red-400 focus:ring-red-400 focus:border-red-400': loginErrors.email }"
            placeholder="Enter your email address"
          />
          <p v-if="loginErrors.email" class="text-red-500 text-sm mt-2 font-medium">{{ loginErrors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-semibold text-[#013DC0] mb-3">Password</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            class="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0761FE] focus:border-[#0761FE] outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
            :class="{ 'border-red-400 focus:ring-red-400 focus:border-red-400': loginErrors.password }"
            placeholder="Enter your password"
          />
          <p v-if="loginErrors.password" class="text-red-500 text-sm mt-2 font-medium">{{ loginErrors.password }}</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-gradient-to-r from-[#0761FE] to-[#013DC0] hover:from-[#013DC0] hover:to-[#0761FE] disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#0761FE] focus:ring-offset-2 shadow-lg hover:shadow-xl">
          {{ isLoading ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <!-- Divider -->
      <div class="mt-8 relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-white text-gray-500 font-medium">Don't have an account?</span>
        </div>
      </div>

      <!-- Sign Up Link -->
      <div class="mt-6 text-center">
        <router-link to="/signup">
          <button class="text-[#0761FE] hover:text-[#013DC0] font-bold transition-colors text-lg">
            Create a new account
          </button>
        </router-link>
      </div>
    </div>
  </div>
</template>