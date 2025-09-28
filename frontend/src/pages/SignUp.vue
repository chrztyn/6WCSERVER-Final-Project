<script setup>
import { ref, reactive } from 'vue'

defineOptions({
    name: 'SignUp'
});

// Form state management
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Form data
const signupForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone_number: '',
  payment_methods: []
})

// Form validation
const signupErrors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone_number: ''
})

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateSignupForm = () => {
  let isValid = true
  
  // Reset errors
  Object.keys(signupErrors).forEach(key => signupErrors[key] = '')
  
  if (!signupForm.name) {
    signupErrors.name = 'Name is required'
    isValid = false
  } else if (signupForm.name.length < 3) {
    signupErrors.name = 'Name must be at least 3 characters'
    isValid = false
  }
  
  if (!signupForm.email) {
    signupErrors.email = 'Email is required'
    isValid = false
  } else if (!validateEmail(signupForm.email)) {
    signupErrors.email = 'Please enter a valid email'
    isValid = false
  }
  
  if (!signupForm.password) {
    signupErrors.password = 'Password is required'
    isValid = false
  } else if (signupForm.password.length < 5) {
    signupErrors.password = 'Password must be at least 5 characters'
    isValid = false
  }
  
  if (!signupForm.confirmPassword) {
    signupErrors.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (signupForm.password !== signupForm.confirmPassword) {
    signupErrors.confirmPassword = 'Passwords do not match'
    isValid = false
  }
  
  return isValid
}

// API call
const handleSignup = async () => {
  if (!validateSignupForm()) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        phone_number: signupForm.phone_number || undefined,
        payment_methods: signupForm.payment_methods
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      successMessage.value = 'Account created successfully! You can now log in.'
      // Reset form
      resetSignupForm()
      // You can redirect to login page after a delay:
      // setTimeout(() => {
      //   this.$router.push('/login')
      // }, 2000)
    } else {
      if (data.errors) {
        errorMessage.value = data.errors.map(err => err.msg).join(', ')
      } else {
        errorMessage.value = data.message || 'Signup failed'
      }
    }
  } catch (error) {
    errorMessage.value = 'Network error. Please try again.'
    console.error('Signup error:', error)
  } finally {
    isLoading.value = false
  }
}

// Form reset function
const resetSignupForm = () => {
  Object.keys(signupForm).forEach(key => {
    if (key === 'payment_methods') {
      signupForm[key] = []
    } else {
      signupForm[key] = ''
    }
  })
  Object.keys(signupErrors).forEach(key => signupErrors[key] = '')
}

// Navigate to login (you'll need to implement this based on your router)
const goToLogin = () => {
  // Example: this.$router.push('/login')
  console.log('Navigate to login page')
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
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p class="text-gray-600">Join us today</p>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
        {{ successMessage }}
      </div>

      <!-- Signup Form -->
      <form @submit.prevent="handleSignup" class="space-y-5">
        <div>
          <label for="name" class="block text-sm font-semibold text-[#013DC0] mb-3">Full Name</label>
          <input
            id="name"
            v-model="signupForm.name"
            type="text"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
            :class="{ 'border-red-500': signupErrors.name }"
            placeholder="Enter your full name"
          />
          <p v-if="signupErrors.name" class="text-red-500 text-sm mt-1">{{ signupErrors.name }}</p>
        </div>

        <div>
          <label for="email" class="block text-sm font-semibold text-[#013DC0] mb-3">Email</label>
          <input
            id="email"
            v-model="signupForm.email"
            type="email"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
            :class="{ 'border-red-500': signupErrors.email }"
            placeholder="Enter your email"
          />
          <p v-if="signupErrors.email" class="text-red-500 text-sm mt-1">{{ signupErrors.email }}</p>
        </div>

        <div>
          <label for="phone" class="block text-sm font-semibold text-[#013DC0] mb-3">Phone Number <span class="text-gray-400">(Optional)</span></label>
          <input
            id="phone"
            v-model="signupForm.phone_number"
            type="tel"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-semibold text-[#013DC0] mb-3">Password</label>
          <input
            id="password"
            v-model="signupForm.password"
            type="password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
            :class="{ 'border-red-500': signupErrors.password }"
            placeholder="Create a password"
          />
          <p v-if="signupErrors.password" class="text-red-500 text-sm mt-1">{{ signupErrors.password }}</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-semibold text-[#013DC0] mb-3">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="signupForm.confirmPassword"
            type="password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
            :class="{ 'border-red-500': signupErrors.confirmPassword }"
            placeholder="Confirm your password"
          />
          <p v-if="signupErrors.confirmPassword" class="text-red-500 text-sm mt-1">{{ signupErrors.confirmPassword }}</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-gradient-to-r from-[#0761FE] to-[#013DC0] hover:from-[#013DC0] hover:to-[#0761FE] disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#0761FE] focus:ring-offset-2 shadow-lg hover:shadow-xl">

          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <!-- Divider -->
      <div class="mt-8 relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-white text-gray-500">Already have an account?</span>
        </div>
      </div>

      <!-- Login Link -->
      <div class="mt-6 text-center">
        <router-link to="/login" >
        <button
          class="text-[#0761FE] hover:text-[#013DC0] font-bold transition-colors text-lg"
        >
          Sign in to your account
        </button></router-link>
      </div>
    </div>
  </div>
</template>