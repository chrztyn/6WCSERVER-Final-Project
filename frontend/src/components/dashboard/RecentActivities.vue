<script>
import { Card } from "@/components/ui/card";
import axios from 'axios';

export default {
    name: "RecentActivities",
    components: { Card },
    data() {
        return {
            activities: [],
            loading: true,
            error: null,
            pollingInterval: null
        };
    },
    async mounted() {
        await this.fetchRecentActivities();
        this.startPolling();
    },
    beforeUnmount() {
        this.stopPolling();
    },
    methods: {
        async fetchRecentActivities() {
            try {
                this.loading = true;
                this.error = null;
                
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3001/api/transactions/recent?limit=20', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                let transactions = response.data.transactions || [];
                
                const seenGroupEvents = new Set();
                const deduplicatedTransactions = [];
                
                for (const transaction of transactions) {
                    if (transaction.transaction_type === 'group_left' || transaction.transaction_type === 'group_joined' ||transaction.transaction_type === 'group_created') {
                        const timestamp = new Date(transaction.transaction_date || transaction.created_at).getTime();
                        const roundedTime = Math.floor(timestamp / 60000);
                        const eventKey = `${transaction.transaction_type}-${transaction.payer_id?._id || transaction.payer_id}-${transaction.group_id?._id || transaction.group_id}-${roundedTime}`;

                        if (seenGroupEvents.has(eventKey)) {
                            continue;
                        }
                        seenGroupEvents.add(eventKey);
                    }
                    
                    deduplicatedTransactions.push(transaction);
                }

                this.activities = deduplicatedTransactions.slice(0, 5).map(transaction => this.transformToActivity(transaction));
                
            } catch (error) {
                console.error('Error fetching recent activities:', error);
                this.error = 'Failed to load activities';
                this.activities = [];
            } finally {
                this.loading = false;
            }
        },
        
        transformToActivity(transaction) {
            const color = this.getActivityColor(transaction.transaction_type);
            const title = this.getActivityTitle(transaction);
            const description = transaction.description;
            const timeAgo = this.getTimeAgo(transaction.transaction_date || transaction.created_at);

            let groupId = null;
            let payerId = null;

            if (transaction.group_id) {
                if (typeof transaction.group_id === 'object' && transaction.group_id._id) {
                    groupId = transaction.group_id._id;
                } else if (typeof transaction.group_id === 'string') {
                    groupId = transaction.group_id;
                }
            }

            if (transaction.payer_id) {
                if (typeof transaction.payer_id === 'object' && transaction.payer_id._id) {
                    payerId = transaction.payer_id._id;
                } else if (typeof transaction.payer_id === 'string') {
                    payerId = transaction.payer_id;
                }
            }
            
            return {
                _id: transaction._id,
                type: transaction.transaction_type,
                color: color,
                title: title,
                description: description,
                timeAgo: timeAgo,
                group_id: groupId, 
                payer_id: payerId,
                transaction_date: transaction.transaction_date || transaction.created_at
            };
        },
        
        getActivityTitle(transaction) {
            const type = transaction.transaction_type;
            const titles = {
                'expense': 'New Expense',
                'payment': 'Payment Made',
                'settlement': 'Settlement',
                'group_joined': 'Group Joined',
                'group_left': 'Left Group',
                'group_created': 'Group Created',
                'expense_completion': 'Expense Completed',
                'expense_deletion': 'Expense Deleted'
            };
            return titles[type] || 'Activity';
        },
        
        getActivityColor(type) {
            const colors = {
                'settlement': 'green',
                'payment': 'green',
                'expense': 'red',
                'expense_completion': 'green',
                'expense_deletion': 'orange',
                'group_joined': 'blue',
                'group_created': 'purple',
                'group_left': 'orange'
            };
            return colors[type] || 'gray';
        },
        
        getTimeAgo(date) {
            const now = new Date();
            const past = new Date(date);
            const diffMs = now - past;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
        
        startPolling() {
            this.pollingInterval = setInterval(() => {
                this.fetchRecentActivitiesSilently();
            }, 30000);
        },
        
        stopPolling() {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
                this.pollingInterval = null;
            }
        },
        
        async fetchRecentActivitiesSilently() {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3001/api/transactions/recent?limit=20', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                let transactions = response.data.transactions || [];

                const seenGroupEvents = new Set();
                const deduplicatedTransactions = [];
                
                for (const transaction of transactions) {
                    if (transaction.transaction_type === 'group_left' || transaction.transaction_type === 'group_joined' || transaction.transaction_type === 'group_created') {
                        const timestamp = new Date(transaction.transaction_date || transaction.created_at).getTime();
                        const roundedTime = Math.floor(timestamp / 60000);
                        const eventKey = `${transaction.transaction_type}-${transaction.payer_id?._id || transaction.payer_id}-${transaction.group_id?._id || transaction.group_id}-${roundedTime}`;

                        if (seenGroupEvents.has(eventKey)) {
                            continue;
                        }
                        seenGroupEvents.add(eventKey);
                    }
                    
                    deduplicatedTransactions.push(transaction);
                }
                
                this.activities = deduplicatedTransactions.slice(0, 5).map(transaction => this.transformToActivity(transaction));
            } catch (error) {
                console.error('Silent fetch error:', error);
            }
        },

        handleActivityClick(activity) {
            const groupTypes = ['group_created', 'group_joined', 'group_left'];
            const transactionTypes = ['settlement', 'payment', 'expense', 'expense_completion', 'expense_deletion'];

            console.log('Activity clicked:', activity);
            console.log('Payer ID:', activity.payer_id);
            
            let userId = null;
            if (activity.payer_id) {
                userId = typeof activity.payer_id === 'object' ? activity.payer_id._id : activity.payer_id;
            }
            
            console.log('Extracted userId:', userId);

            if (groupTypes.includes(activity.type) && activity.group_id) {
                this.$emit("activity-click", {
                    type: "group",
                    id: activity.group_id,
                    activityType: activity.type,
                    userId: userId 
                });
            } else if (transactionTypes.includes(activity.type) && activity._id) {
                this.$emit("activity-click", {
                    type: "transaction",
                    id: activity._id
                });
            } else {
                const id = activity.group_id || activity._id;
                if (id) {
                    this.$emit("activity-click", {
                        type: activity.group_id ? "group" : "transaction",
                        id,
                        activityType: activity.type,
                        userId: userId 
                    });
                } else {
                    console.warn('No valid ID found for activity:', activity);
                }
            }
        },
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
                :key="`${activity.type}-${activity._id}`"
                class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                @click="handleActivityClick(activity)"
            >
                <div 
                    class="mt-1 h-3 w-3 rounded-full flex-shrink-0"
                    :class="{
                        'bg-green-500': activity.color === 'green',
                        'bg-red-500': activity.color === 'red',
                        'bg-blue-500': activity.color === 'blue',
                        'bg-purple-500': activity.color === 'purple',
                        'bg-orange-500': activity.color === 'orange',
                        'bg-gray-500': !['green', 'red', 'blue', 'purple', 'orange'].includes(activity.color)
                    }"
                ></div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-[#013DC0] text-sm">{{ activity.title }}</div> 
                    <div class="text-gray-500 text-xs truncate">{{ activity.description }}</div>
                </div>
                <div class="text-gray-400 text-xs flex-shrink-0">{{ activity.timeAgo }}</div>
            </div>
        </div>
    </Card>
</template>
