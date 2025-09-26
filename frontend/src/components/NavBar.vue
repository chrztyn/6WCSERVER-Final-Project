<script setup>
    import { defineOptions } from "vue"
    import Button from "./ui/button/Button.vue";

    defineOptions({
        name: 'NavBar'
    });
</script>

<template>
    <nav class="bg-none border-gray-200 dark:bg-gray-900 absolute top-0 left-0 w-full z-10">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="/" class="flex items-center space-x-3 rtl:space-x-reverse">
            <span class="self-center text-3xl font-bold whitespace-nowrap dark:text-white">SplitSmart</span>
        </a>
        <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
            <button type="button" class="text-black bg-none border border-black hover:bg-blue-500 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center shadow-md">Sign In</button>
            <Button type="button" class="text-white border border-blue-700 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center mx-2">Get started</Button>
        </div>
        </div>
    </nav>
</template>