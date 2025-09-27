<script>
export default {
    name: "Sidebar",
    inject: ['openGroupList'],
    data() {
        return {
            activeNav: 'dashboard' // Default to dashboard
        };
    },
    created() {
        this.updateActiveNav();
    },
    watch: {
        '$route'() {
            this.updateActiveNav();
        }
    },
    methods: {
        updateActiveNav() {
            const currentPath = this.$route.path;
            if (currentPath.startsWith('/group/')) {
                this.activeNav = 'groups';
            } else if (currentPath === '/dashboard') {
                this.activeNav = 'dashboard';
            } else if (currentPath === '/reports') {
                this.activeNav = 'reports';
            } else if (currentPath === '/profile') {
                this.activeNav = 'profile';
            } else {
                this.activeNav = 'dashboard';
            }
        },
        handleGroupsClick() {
            this.activeNav = 'groups';
            this.openGroupList();
        },
        handleDashboardClick() {
            this.activeNav = 'dashboard';
        },
        handleReportsClick() {
            this.activeNav = 'reports';
        },
        handleProfileClick() {
            this.activeNav = 'profile';
        },
        resetActiveState() {
            this.activeNav = 'dashboard'; // Reset to default
        }
    }
};
</script>

<template>
    <aside class="w-64 bg-white border-r border-gray-200 p-6 sticky top-0 h-screen shadow-sm">
        <!-- placeholder for pfp -->
        <div class="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-[#0761FE] to-[#013DC0] flex items-center justify-center">
        </div>
        <!-- placeholder for name -->
        <div class="text-center font-semibold text-[#013DC0] mb-8 text-lg">
            Micah Lapuz
        </div> 
        <nav class="grid gap-3">
            <router-link 
                class="flex items-center gap-3 rounded-lg px-4 py-3 transition-all font-medium"
                :class="activeNav === 'dashboard' ? 'bg-[#EDF5FB] text-[#0761FE] border-r-2 border-[#0761FE]' : 'text-[#013DC0] hover:bg-[#EDF5FB] hover:text-[#0761FE]'"
                to="/dashboard"
                @click="handleDashboardClick"
            >
                <img src="/Icons/blue dashboard.png" alt="Dashboard Icon" class="w-5 h-5"> 
                Dashboard
            </router-link>
            <button 
                class="flex items-center gap-3 rounded-lg px-4 py-3 transition-all font-medium"
                :class="activeNav === 'groups' ? 'bg-[#EDF5FB] text-[#0761FE] border-r-2 border-[#0761FE]' : 'text-[#0761FE] hover:bg-[#EDF5FB] hover:text-[#013DC0]'"
                @click="handleGroupsClick"
            >
                <img src="/Icons/blue groups.png" alt="Groups Icon" class="w-5 h-5">        
                Groups
            </button>
            <router-link 
                class="flex items-center gap-3 rounded-lg px-4 py-3 transition-all font-medium"
                :class="activeNav === 'reports' ? 'bg-[#EDF5FB] text-[#0761FE] border-r-2 border-[#0761FE]' : 'text-[#013DC0] hover:bg-[#EDF5FB] hover:text-[#0761FE]'"
                to="/reports"
                @click="handleReportsClick"
            >
                <img src="/Icons/blue report.png" alt="Report Icon" class="w-5 h-5"> 
                Reports
            </router-link>
            <router-link 
                class="flex items-center gap-3 rounded-lg px-4 py-3 transition-all font-medium"
                :class="activeNav === 'profile' ? 'bg-[#EDF5FB] text-[#0761FE] border-r-2 border-[#0761FE]' : 'text-[#013DC0] hover:bg-[#EDF5FB] hover:text-[#0761FE]'"
                to="/profile"
                @click="handleProfileClick"
            >
                <img src="/Icons/blue profile.png" alt="Profile Icon" class="w-5 h-5"> 
                Profile
            </router-link>
        </nav>
        <div class="absolute left-6 right-6 bottom-6">
            <a class="flex items-center gap-3 rounded-lg px-4 py-3 text-red-600 hover:bg-red-50 transition-all font-medium" href="#" >
                <img src="/Icons/blue logout.png" alt="Logout Icon" class="w-5 h-5"> 
                Logout
            </a>
        </div>
    </aside>
</template>
