<script>
import { Card } from "@/components/ui/card";
export default {
    name: "ReportOverview",
    components: { Card },
    data() {
        // returning names placeholder
        return { 
            names: [
                "Firstname Lastname",
                "Micah Lapuz",
                "Clarence Parungao",
                "Kyle Payawal",
                "Maxene Quiambao",
                "Christine Yunun",
            ] 
        };
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
        <div class="grid gap-3">
            <div v-for="n in names" :key="n" class="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="text-sm font-medium text-[#013DC0]">{{ n }}</div>
                <!-- placeholder for total fee per name -->
                <span class="rounded-md bg-red-500 px-3 py-1 text-xs font-bold text-white">PHP 0.00</span>
            </div>
        </div>
    </Card>
</template>