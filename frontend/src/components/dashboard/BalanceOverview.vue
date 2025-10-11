    <script>
    import { Card } from "@/components/ui/card";
    import api from '@/services/api.js';

    export default {
        name: "BalanceOverview",
        components: { Card },
        data() {
            return {
                balanceData: null,
                loading: true,
                error: null
            };
        },
        computed: {
            totalOwes() {
                return this.balanceData?.total?.Debts || 0;
            },
            totalOwed() {
                return this.balanceData?.total?.Credits || 0;
            }
        },
        async mounted() {
            await this.fetchBalanceData();
        },
        methods: {
            async fetchBalanceData() {
                try {
                    this.loading = true;
                    this.error = null;
                    
                    const response = await api.get('http://localhost:3001/api/balances/summary/me');
                    this.balanceData = response.data;
                    
                } catch (error) {
                    console.error('Error fetching balance data:', error);
                    this.error = 'Failed to load balance data';
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
            <div class="flex items-center gap-3 mb-6">
                <div class="h-8 w-8 rounded-lg bg-[#0761FE] flex items-center justify-center">
                    <img src="/Icons/light balanceo.png" alt="Balance Overview Icon" class="w-5 h-5">
                </div>
                <h3 class="text-lg font-semibold text-[#013DC0]">Balance Overview</h3>
            </div>
            
            <!-- Loading state -->
            <div v-if="loading" class="grid gap-4">
                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 animate-pulse">
                    <div class="flex items-center gap-3">
                        <div class="h-2 w-2 rounded-full bg-gray-300"></div>
                        <span class="text-gray-500">Loading...</span>
                    </div>
                    <div class="h-6 w-20 bg-gray-300 rounded"></div>
                </div>
                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 animate-pulse">
                    <div class="flex items-center gap-3">
                        <div class="h-2 w-2 rounded-full bg-gray-300"></div>
                        <span class="text-gray-500">Loading...</span>
                    </div>
                    <div class="h-6 w-20 bg-gray-300 rounded"></div>
                </div>
            </div>
            
            <!-- Error state -->
            <div v-else-if="error" class="text-center p-4 text-red-600">
                {{ error }}
                <button @click="fetchBalanceData" class="block mx-auto mt-2 text-sm text-blue-600 hover:underline">
                    Try Again
                </button>
            </div>
            
            <!-- Data state -->
            <div v-else class="grid gap-4">
                <div class="flex items-center h-11 justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                    <div class="flex items-center gap-3">
                        <div class="h-2 w-2 rounded-full bg-red-500"></div>
                        <span class="text-gray-700 font-medium">You Owe</span>
                    </div>
                    <!-- Total amount user owes to others -->
                    <div class="font-bold text-red-600 text-lg">{{ formatCurrency(totalOwes) }}</div>
                </div>
                <div class="flex items-center h-11 justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                    <div class="flex items-center gap-3">
                        <div class="h-2 w-2 rounded-full bg-green-500"></div>
                        <span class="text-gray-700 font-medium">Owes You</span>
                    </div>
                    <!-- Total amount others owe to user -->
                    <div class="font-bold text-green-600 text-lg">{{ formatCurrency(totalOwed) }}</div>
                </div>
            </div>
        </Card>
    </template>