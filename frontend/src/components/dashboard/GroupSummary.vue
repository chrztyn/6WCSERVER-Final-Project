<script>
import { Card } from "@/components/ui/card";
import groupService from '@/services/groupService';
import axios from 'axios';

export default {
    name: "GroupSummary",
    components: { Card },
    data() {
        return {
            groups: [],
            loading: false,
            error: null
        };
    },
    async mounted() {
        await this.fetchGroups();
    },
    methods: {
        async fetchGroups() {
            this.loading = true;
            this.error = null;
            
            try {
                this.groups = await groupService.getMyGroups();
                
                if (this.groups && this.groups.length > 0) {
                    await this.fetchGroupExpenses();
                }
                
            } catch (err) {
                console.error('Error fetching groups:', err);
                this.error = err.response?.data?.error || err.message || 'Failed to load groups';
            } finally {
                this.loading = false;
            }
        },
        
        async fetchGroupExpenses() {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                
                for (let group of this.groups) {
                    try {
                        const expenseResponse = await axios.get(`http://localhost:3001/api/expenses/${group._id}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        const expenses = expenseResponse.data.expenses || [];
                        const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
                        
                        group.totalExpenses = totalExpenses;
                        
                    } catch (expenseError) {
                        console.warn(`Could not fetch expenses for group ${group.name}:`, expenseError);
                        group.totalExpenses = 0;
                    }
                }
            } catch (err) {
                console.warn('Could not fetch group expenses:', err);
                this.groups.forEach(group => {
                    group.totalExpenses = 0;
                });
            }
        },
        
        formatAmount(amount) {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        },
        
        viewGroupDetails(groupId) {
            this.$router.push(`/group/${groupId}`);
        },
        
        async refreshGroups() {
            await this.fetchGroups();
        },
    }
};
</script>

<template>
    <Card class="card">
        <div class="flex items-center gap-3 mb-6">
            <div class="h-8 w-8 rounded-lg bg-[#0761FE] flex items-center justify-center">
                <img src="/Icons/light summary.png" alt="Group Summary Icon" class="w-5 h-5"> 
            </div>
            <h3 class="text-lg font-semibold text-[#013DC0]">Group Summary</h3>
        </div>
        
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Loading groups...</p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="text-center py-8">
            <p class="text-red-600">{{ error }}</p>
            <button @click="refreshGroups" class="text-sm text-[#0761FE] hover:underline mt-2">
                Try again
            </button>
        </div>
        
        <!-- Groups display -->
        <div v-else-if="groups.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
                v-for="group in groups.slice(0, 6)" 
                :key="group._id"
                class="rounded-lg border border-gray-200 p-4 hover:border-[#07CAFC] hover:shadow-md transition-all cursor-pointer"
                @click="viewGroupDetails(group._id)"
            >
                <div class="text-sm text-gray-600 mb-1">{{ group.name }}</div>
                <div class="font-bold text-[#013DC0] text-lg">{{ formatAmount(group.totalExpenses || 0) }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ group.members?.length || 0 }} members</div>
            </div>
        </div>
        
        <!-- No groups state -->
        <div v-else class="text-center py-8">
            <p class="text-gray-600">No groups found. Create your first group to get started!</p>
        </div>
    </Card>
</template>
