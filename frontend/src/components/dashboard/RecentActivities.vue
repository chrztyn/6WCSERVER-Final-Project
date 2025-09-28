<script>
import { Card } from "@/components/ui/card";
import api from '@/services/api.js';

export default {
    name: "RecentActivities",
    components: { Card },
    data() {
        return {
            activities: [],
            loading: true,
            error: null
        };
    },
    async mounted() {
        await this.fetchRecentActivities();
    },
    methods: {
        async fetchRecentActivities() {
            try {
                this.loading = true;
                this.error = null;
                
                const response = await api.get('http://localhost:3001/api/reports/activities?limit=5');
                this.activities = response.data.activities;
                
            } catch (error) {
                console.error('Error fetching recent activities:', error);
                this.error = 'Failed to load activities';
                this.activities = [];
            } finally {
                this.loading = false;
            }
        },
        getActivityIcon(type) {
            const icons = {
                'settlement': 'green',
                'expense_added': 'red',
                'group_joined': 'blue',
                'group_created': 'purple'
            };
            return icons[type] || 'gray';
        },
        getActivityDescription(activity) {
            switch (activity.type) {
                case 'settlement':
                    return `${activity.group}`;
                case 'expense_added':
                    return `${activity.group}`;
                case 'group_joined':
                case 'group_created':
                    return activity.description;
                default:
                    return activity.description;
            }
        }
    }
};
</script>

<template>
    <Card class="card">
        <div class="flex items-center gap-3 mb-6">
            <div class="h-8 w-8 rounded-lg bg-[#0761FE] flex items-center justify-center">
                <img src="/Icons/light activities.png" alt="RecentActivities Icon" class="w-5 h-5"> 
            </div>
            <h3 class="text-lg font-semibold text-[#013DC0]">Recent Activities</h3>
        </div>
        
        <!-- Loading State -->
        <div v-if="loading" class="grid gap-4">
            <div v-for="i in 3" :key="`loading-${i}`" class="flex items-start gap-3 p-3 rounded-lg animate-pulse">
                <div class="mt-1 h-3 w-3 rounded-full bg-gray-300 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                    <div class="h-4 bg-gray-200 rounded mb-1 w-24"></div>
                    <div class="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div class="h-3 bg-gray-200 rounded w-16 flex-shrink-0"></div>
            </div>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="text-center p-4">
            <p class="text-red-600 text-sm mb-2">{{ error }}</p>
            <button 
                @click="fetchRecentActivities" 
                class="text-xs text-blue-600 hover:underline"
            >
                Try Again
            </button>
        </div>
        
        <!-- No Data State -->
        <div v-else-if="activities.length === 0" class="text-center p-4">
            <p class="text-gray-500 text-sm">No recent activities</p>
        </div>
        
        <!-- Activities List -->
        <div v-else class="grid gap-4">
            <div 
                v-for="activity in activities" 
                :key="`${activity.type}-${activity.timestamp}`"
                class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <div 
                    class="mt-1 h-3 w-3 rounded-full flex-shrink-0"
                    :class="{
                        'bg-green-500': activity.color === 'green',
                        'bg-red-500': activity.color === 'red',
                        'bg-blue-500': activity.color === 'blue',
                        'bg-purple-500': activity.color === 'purple',
                        'bg-gray-500': !['green', 'red', 'blue', 'purple'].includes(activity.color)
                    }"
                ></div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-[#013DC0] text-sm">{{ activity.title }}</div> 
                    <div class="text-gray-500 text-xs">{{ getActivityDescription(activity) }}</div>
                </div>
                <div class="text-gray-400 text-xs flex-shrink-0">{{ activity.timeAgo }}</div>
            </div>
        </div>
    </Card>
</template>