<script>
export default {
    name: "OwesYouCard",
    props: {
        items: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    methods: {
        getStatusClass(status) {
            switch (status) {
                case 'paid':
                    return 'bg-green-100 text-green-800 border-green-200';
                case 'pending':
                    return 'bg-gray-100 text-gray-600 border-gray-200';
                default:
                    return 'bg-gray-100 text-gray-600 border-gray-200';
            }
        }
    }
};
</script>

<template>
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
        <div class="mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-2">Owes You</h2>
            <p class="text-sm text-gray-500 italic">A list of all the money that other group members need to pay to you.</p>
        </div>
        
        <div class="space-y-4">
            <div 
                v-for="item in items" 
                :key="item.id"
                class="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
            >
                <div class="flex-1">
                    <div class="font-medium text-gray-800">{{ item.title }}</div>
                    <div class="text-sm text-gray-600">{{ item.name }}</div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-lg font-semibold text-gray-800">
                        {{ item.amount.toFixed(2) }}
                    </div>
                    <span 
                        :class="getStatusClass(item.status)"
                        class="px-3 py-1 rounded-full text-xs font-medium border"
                    >
                        {{ item.status }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>