<script>
import { Card } from "@/components/ui/card";
export default {
    name: "RecentActivities",
    components: { Card },
};
</script>

<template>
    <Card class="card">
        <div class="flex items-center gap-3 mb-6">
            <div class="h-8 w-8 rounded-lg bg-[#0761FE] flex items-center justify-center">
                <img src="/public/icons/light activities.png" alt="RecentActivities Icon" class="w-5 h-5"> 
            </div>
            <h3 class="text-lg font-semibold text-[#013DC0]">Recent Activities</h3>
        </div>
        <div class="grid gap-4">
            <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="mt-1 h-3 w-3 rounded-full bg-green-500 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                    <!-- placeholder for marked settlement = title, name, time-->
                    <div class="font-semibold text-[#013DC0] text-sm">Marked Settlement</div> 
                    <div class="text-gray-500 text-xs">name</div>
                </div>
                <div class="text-gray-400 text-xs flex-shrink-0">insert time</div>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="mt-1 h-3 w-3 rounded-full bg-red-500 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                    <!-- placeholder for added expense = title, name, time-->
                    <div class="font-semibold text-[#013DC0] text-sm">Added Expense</div>
                    <div class="text-gray-500 text-xs">activity</div>
                </div>
                <div class="text-gray-400 text-xs flex-shrink-0">2 hours ago</div>
            </div>
        </div>
    </Card>
</template>
