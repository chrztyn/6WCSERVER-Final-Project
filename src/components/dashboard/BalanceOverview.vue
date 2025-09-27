<script>
import { Card } from "@/components/ui/card";

export default {
    name: "BalanceOverview",
    components: { Card },
};
</script>

<template>
    <Card class="card">
        <div class="flex items-center gap-3 mb-6">
            <div class="h-8 w-8 rounded-lg bg-[#0761FE] flex items-center justify-center">
                <img src="/public/icons/light balanceo.png" alt="Balance Overview Icon" class="w-5 h-5">
            </div>
            <h3 class="text-lg font-semibold text-[#013DC0]">Balance Overview</h3>
        </div>
        <div class="grid gap-4">
            <div class="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                <div class="flex items-center gap-3">
                    <div class="h-2 w-2 rounded-full bg-red-500"></div>
                    <span class="text-gray-700 font-medium">You Owe</span>
                </div>
                <!-- placeholder for total owe fee -->
                <div class="font-bold text-red-600 text-lg">PHP 0.00</div>
            </div>
            <div class="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                <div class="flex items-center gap-3">
                    <div class="h-2 w-2 rounded-full bg-green-500"></div>
                    <span class="text-gray-700 font-medium">Owes You</span>
                </div>
                <!-- placeholder for total owes fee -->
                <div class="font-bold text-green-600 text-lg">PHP 0.00</div>
            </div>
        </div>
    </Card>
</template>