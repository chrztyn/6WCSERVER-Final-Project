<script>
import { Card } from "@/components/ui/card";
import api from '@/services/api.js';

export default {
    name: "ReportOverview",
    components: { Card },
    data() {
        return { 
            youOweData: [],
            loading: true,
            error: null
        };
    },
    async mounted() {
        await this.fetchReportOverview();
    },
    methods: {
        async fetchReportOverview() {
            try {
                this.loading = true;
                this.error = null;
                
                const response = await api.get('http://localhost:3001/api/reports/overview');
                
                // Map the backend data to frontend format
                this.youOweData = response.data.overView.youOwe || [];
                
            } catch (error) {
                console.error('Error fetching report overview:', error);
                this.error = 'Failed to load report data';
                this.youOweData = [];
            } finally {
                this.loading = false;
            }
        },
        formatCurrency(amount) {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
            }).format(amount);
        }
    }
};
</script>

<template>
    <Card class="card">
        <div class="flex items-center gap-3 mb-4">
            <div class="h-8 w-8 rounded-lg bg-[#0761FE] flex items-center justify-center">
                <img src="/Icons/light reporto.png" alt="Report Overview Icon" class="w-5 h-5"> 
            </div>
            <div>
                <h3 class="text-lg font-semibold text-[#013DC0]">Report Overview</h3>
                <p class="text-xs text-gray-500">you owe the following</p>
            </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="loading" class="grid gap-3">
            <div v-for="i in 3" :key="`loading-${i}`" class="flex items-center justify-between gap-3 p-3 rounded-lg animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-32"></div>
                <div class="h-6 bg-gray-200 rounded w-16"></div>
            </div>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="text-center p-4">
            <p class="text-red-600 text-sm mb-2">{{ error }}</p>
            <button 
                @click="fetchReportOverview" 
                class="text-xs text-blue-600 hover:underline"
            >
                Try Again
            </button>
        </div>
        
        <!-- No Data State -->
        <div v-else-if="youOweData.length === 0" class="text-center p-4">
            <p class="text-gray-500 text-sm">No outstanding debts</p>
        </div>
        
        <!-- Data State -->
        <div v-else class="grid gap-3">
            <div 
                v-for="person in youOweData" 
                :key="person.name" 
                class="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <div class="text-sm font-medium text-[#013DC0]">{{ person.name }}</div>
                <span class="rounded-md bg-red-500 px-3 py-1 text-xs font-bold text-white">
                    {{ formatCurrency(person.amount) }}
                </span>
            </div>
        </div>
    </Card>
</template>