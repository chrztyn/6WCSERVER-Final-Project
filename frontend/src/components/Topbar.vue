<script>
export default{
    name: "Topbar",
};
</script>

<template>
    <div class="flex items-center gap-4 p-6 w-full mx-auto bg-white border-b border-gray-200 shadow-sm">
        <div class="text-xl font-bold text-[#0761FE] tracking-tight">SplitSmart</div>
        <div class="flex-1 relative">
            <input 
                class="w-full h-10 rounded-lg border border-gray-300 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0761FE] focus:border-transparent transition-all" 
                placeholder="Search groups, expenses, or people..." 
            />
            <svg class="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
        </div>
    <div class="h-10 w-10 rounded-lg bg-[#0761FE] hover:bg-[#013DC0] flex items-center justify-center border-none p-0">
        <img src="/Icons/light notif.png" alt="Light Notification Icon" class="h-6 w-6">
    </div>
    </div>
</template>
