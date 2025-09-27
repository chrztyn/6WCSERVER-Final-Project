<script>
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export default {
    name: "QuickAccess",
    components: { Card, Button },
};
</script>

<template>
    <Card class="card">
        <div class="flex items-center gap-3 mb-6">
            <div class="h-8 w-8 rounded-lg bg-[#0761FE] flex items-center justify-center">
                <img src="/public/icons/light quick.png" alt="Quick Access Icon" class="w-5 h-5"> 
            </div>
            <h3 class="text-lg font-semibold text-[#013DC0]">Quick Access</h3>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <button class="button w-full flex items-center justify-center gap-2">
                <img src="/public/icons/light add.png" alt="Dashboard Icon" class="w-5 h-5"> 
                New Group
            </button>
            <button class="button w-full flex items-center justify-center gap-2">
                <img src="/public/icons/light debt.png" alt="Dashboard Icon" class="w-5 h-5"> 
                Settle Debt
            </button>
        </div>
    </Card>
</template>
