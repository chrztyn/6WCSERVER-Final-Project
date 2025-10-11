<script>
import YouOweCard from '../components/reports/YouOweCard.vue';
import OwesYouCard from '../components/reports/OwesYouCard.vue';
import api from '@/services/api.js';

export default {
  name: "Reports",
  components: {
    YouOweCard,
    OwesYouCard
  },
  data() {
    return {
      youOwe: [],
      owesYou: [],
      loading: true,
      error: null
    };
  },
  async mounted() {
    await this.fetchReportsData();
  },
  methods: {
    async fetchReportsData() {
      try {
        this.loading = true;
        this.error = null;
        
        // Fetch detailed report data
        const response = await api.get('http://localhost:3001/api/reports/detailed');
        
        // Map backend data to frontend format
        this.youOwe = response.data.detailed.youOwe.map((item, index) => ({
          id: index + 1,
          title: item.title,
          name: item.to,
          amount: item.amount,
          status: item.status
        }));
        
        this.owesYou = response.data.detailed.owesYou.map((item, index) => ({
          id: index + 1,
          title: item.title,
          name: item.from,
          amount: item.amount,
          status: item.status
        }));
        
      } catch (error) {
        console.error('Error fetching reports data:', error);
        this.error = 'Failed to load reports data';
        
        // Fallback to empty arrays on error
        this.youOwe = [];
        this.owesYou = [];
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<template>
  <div class="reports-container">
    <div class="max-w-6xl mx-auto p-8">
      <!-- Header Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[#013DC0] mb-2">Report Details</h1>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded w-full"></div>
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded w-full"></div>
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button 
          @click="fetchReportsData" 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
      
      <!-- Report Cards -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <YouOweCard :items="youOwe" />
        <OwesYouCard :items="owesYou" />
      </div>
    </div>
  </div>
</template>