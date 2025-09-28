<script>
export default {
    name: 'ConfirmCardOverlay',
    props: {
        isOpen: {
            type: Boolean,
            required: true
        },
        title: {
            type: String,
            default: 'Confirm Action'
        },
        message: {
            type: String,
            default: 'Are you sure you want to proceed?'
        }
    },
    emits: ['confirm', 'cancel'],
    methods: {
        confirm() {
            this.$emit('confirm');
        },
        cancel() {
            this.$emit('cancel');
        }
    }
};
</script>

<template>
    <div 
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50"
    >
        <div class="bg-white rounded-lg shadow-xl w-100 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">{{ title }}</h3>
            <p class="text-gray-600 mb-6">{{ message }}</p>

            <div class="flex justify-end gap-3">
                <button
                    @click="cancel"
                    class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Cancel
                </button>
                <button
                    @click="confirm"
                    class="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
</template>