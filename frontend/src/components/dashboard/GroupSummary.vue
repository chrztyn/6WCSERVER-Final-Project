<script>
import { Card } from "@/components/ui/card";
export default {
    name: "GroupSummary",
    components: { Card },
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
        <div class="grid grid-cols-3 gap-4">
            <div class="rounded-lg border border-gray-200 p-4 hover:border-[#07CAFC] hover:shadow-md transition-all">
                <!-- placeholder for group name and total fee -->
                <div class="text-sm text-gray-600 mb-1">Group A</div>
                <div class="font-bold text-[#013DC0] text-lg">PHP 0.00</div>
            </div>
            <div class="rounded-lg border border-gray-200 p-4 hover:border-[#07CAFC] hover:shadow-md transition-all">
                <!-- placeholder for group name and total fee -->
                <div class="text-sm text-gray-600 mb-1">Group B</div>
                <div class="font-bold text-[#013DC0] text-lg">PHP 0.00</div>
            </div>
            <div class="rounded-lg border border-gray-200 p-4 hover:border-[#07CAFC] hover:shadow-md transition-all">
                <!-- placeholder for group name and total fee -->
                <div class="text-sm text-gray-600 mb-1">Group C</div>
                <div class="font-bold text-[#013DC0] text-lg">PHP 0.00</div>
            </div>
        </div>
    </Card>
</template>