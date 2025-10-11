<script>
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateGroupForm from '../CreateGroupForm.vue';
import SettleDebtOverlay from '../SettleDebtOverlay.vue';

export default {
    name: "QuickAccess",
    components: { 
        Card, 
        Button, 
        CreateGroupForm,
        SettleDebtOverlay 
    },
    props: {
        isOpen: {
            type: Boolean,
            default: false
        }
    },  
    emits: ['close'],

    data() {
        return {
            showCreateForm: false,
            showSettleDebtOverlay: false
        };
    },

    methods: {
        async createGroup() {
            this.showCreateForm = true;
        },

        closeCreateForm() {
            this.showCreateForm = false;
        },

        onGroupCreated(newGroup) {
            const formattedGroup = {
                id: newGroup._id,
                name: newGroup.name,
                description: newGroup.description || 'No description',
                created_by: newGroup.created_by,
                members: newGroup.members,
                created_at: newGroup.created_at
            };
            
            this.showCreateForm = false;
            console.log('New group added to list:', formattedGroup);
        },

        openSettleDebtOverlay() {
            this.showSettleDebtOverlay = true;
        },

        closeSettleDebtOverlay() {
            this.showSettleDebtOverlay = false;
        },

        closeOverlay() {
            this.$emit('close');
        },
    }
};
</script>

<template>
    <Card class="card">
        <div class="flex items-center gap-3 mb-6">
            <div class="h-8 w-8 rounded-lg bg-[#0761FE] flex items-center justify-center">
                <img src="/Icons/light quick.png" alt="Quick Access Icon" class="w-5 h-5"> 
            </div>
            <h3 class="text-lg font-semibold text-[#013DC0]">Quick Access</h3>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <button 
                @click="createGroup"
                class="w-full bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg p-3 font-medium transition-colors flex items-center justify-center gap-2"
            >
                <img src="/Icons/light add.png" alt="Add Icon" class="w-5 h-5"> 
                New Group
            </button>
            <button 
                @click="openSettleDebtOverlay"
                class="w-full bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg p-3 font-medium transition-colors flex items-center justify-center gap-2"
            >
                <img src="/Icons/light debt.png" alt="Settle Debt Icon" class="w-5 h-5"> 
                Settle Debt
            </button>
        </div>
        
        <!-- Create Group Form -->
        <CreateGroupForm 
            :isOpen="showCreateForm"
            @close="closeCreateForm"
            @group-created="onGroupCreated"
            class="z-10"
        />

        <!-- Settle Debt Overlay -->
        <SettleDebtOverlay
            :isOpen="showSettleDebtOverlay"
            @close="closeSettleDebtOverlay"
            class="z-10"
        />
    </Card>
</template>