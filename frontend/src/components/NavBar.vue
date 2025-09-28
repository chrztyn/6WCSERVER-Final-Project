<script setup>
    import Button from "./ui/button/Button.vue";

    defineOptions({
        name: 'NavBar'
    });
</script>

<template>
    <nav class="backdrop-blur-sm absolute top-0 left-0 w-full z-10">
        <div class="max-w-7xl flex flex-wrap items-center justify-between mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <a href="/" class="flex items-center space-x-3 rtl:space-x-reverse">
            <span class="text-xl font-bold text-[#0761FE] tracking-tight whitespace-nowrap dark:text-white">SplitSmart</span>
        </a>
        <div class="flex items-center space-x-3 md:order-2">

            <router-link to="/login">
                <button type="button" class="text-[#0761FE] border border-[#0761FE] hover:bg-[#EBF5FF] focus:ring-4 focus:outline-none focus:ring-blue-100 font-medium rounded-md text-sm px-5 py-2.5 text-center transition-colors duration-200 ease-in-out">
                    Sign In
                </button>
            </router-link>

            <router-link to="/signup">
                <button type="button" class="text-white bg-[#0761FE] hover:bg-[#013DC0] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 text-center transition-colors duration-200 ease-in-out">
                    Get Started
                </button>
            </router-link>
        </div>
        </div>
    </nav>
</template>