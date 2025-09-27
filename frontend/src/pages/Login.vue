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
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p class="text-gray-600">Sign in to your account</p>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
        {{ successMessage }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            id="email"
            v-model="loginForm.email"
            type="email"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
            :class="{ 'border-red-500': loginErrors.email }"
            placeholder="Enter your email"
          />
          <p v-if="loginErrors.email" class="text-red-500 text-sm mt-1">{{ loginErrors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
            :class="{ 'border-red-500': loginErrors.password }"
            placeholder="Enter your password"
          />
          <p v-if="loginErrors.password" class="text-red-500 text-sm mt-1">{{ loginErrors.password }}</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {{ isLoading ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <!-- Forgot Password -->
      <div class="mt-4 text-center">
        <a href="#" class="text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
          Forgot your password?
        </a>
      </div>

      <!-- Divider -->
      <div class="mt-8 relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-white text-gray-500">Don't have an account?</span>
        </div>
      </div>

      <!-- Sign Up Link -->
      <div class="mt-6 text-center">
        <button class="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
            <router-link to="/signup">
                Create a new account
            </router-link>
        </button>
      </div>
    </div>
  </div>
</template>