<script>
export default {
    name: "Sidebar",
    inject: ['openGroupList'],
    data() {
        return {
            activeNav: 'dashboard',
            user: {
                name: '',
                email: '',
                phone: '',
                password: '',
                profilePicture: null
            }
        };
    },
    created() {
        this.updateActiveNav();
        this.loadUserData();
        this.setupProfilePictureListener();
    },
    watch: {
        '$route'() {
            this.updateActiveNav();
        }
    },
    methods: {
        async loadUserData() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No token found');
                    return;
                }

                const response = await fetch('http://localhost:3001/api/users/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    this.user = userData;
                    console.log('User data loaded:', userData);
                } else {
                    console.error('Failed to fetch user data');
                    if (response.status === 401 || response.status === 403) {
                        this.handleLogout();
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                this.user = null;
            }
        },
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
            } else if (currentPath === '/transaction') {
                this.activeNav = 'transaction';
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
        handleTransactionClick() {
            this.activeNav = 'transaction';
        },
        resetActiveState() {
            this.activeNav = 'dashboard';
        },
        handleLogout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            this.$router.push('/landing');
        },
        loadUserData() {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    this.user = {
                        name: parsedUser.name || parsedUser.firstName + ' ' + parsedUser.lastName || '',
                        email: parsedUser.email || '',
                        phone: parsedUser.phone || '',
                        password: '',
                        profilePicture: parsedUser.profilePicture || null
                    };
                } catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }
        },
        setupProfilePictureListener() {
            window.addEventListener('profilePictureUpdated', (event) => {
                this.user.profilePicture = event.detail.profilePicture;
                const userData = localStorage.getItem('user');
                if (userData) {
                    try {
                        const parsedUser = JSON.parse(userData);
                        parsedUser.profilePicture = event.detail.profilePicture;
                        localStorage.setItem('user', JSON.stringify(parsedUser));
                    } catch (error) {
                        console.error('Error updating user data:', error);
                    }
                }
            });
        }
    }
};
</script>

<template>
    <aside class="w-64 bg-white border-r border-gray-200 p-6 sticky top-0 h-screen shadow-sm">
        <!-- Profile Picture -->
        <div class="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-[#0761FE] to-[#013DC0] flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
            <img 
                v-if="user.profilePicture"
                :src="user.profilePicture"
                alt="Profile Picture"
                class="w-full h-full object-cover"
            >
            <span v-else class="text-white font-semibold text-xl">
                {{ user.name.charAt(0).toUpperCase() }}
            </span>
        </div>
        <!-- User Name -->
        <div class="text-center font-semibold text-[#013DC0] mb-8 text-lg">
            {{ user && user.name ? user.name : 'Loading...' }}
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
            <router-link 
                class="flex items-center gap-3 rounded-lg px-4 py-3 transition-all font-medium"
                :class="activeNav === 'transaction' ? 'bg-[#EDF5FB] text-[#0761FE] border-r-2 border-[#0761FE]' : 'text-[#013DC0] hover:bg-[#EDF5FB] hover:text-[#0761FE]'"
                to="/transaction"
                @click="handleTransactionClick"
            >
                <img src="/Icons/blue history.png" alt="Profile Icon" class="w-5 h-5"> 
                Transactions
            </router-link>
        </nav>
        <div class="absolute left-6 right-6 bottom-6">
            <button 
                class="flex items-center gap-3 rounded-lg px-4 py-3 text-red-600 hover:bg-red-50 transition-all font-medium w-full" 
                @click="handleLogout"
            >
                <img src="/Icons/blue logout.png" alt="Logout Icon" class="w-5 h-5"> 
                Logout
            </button>
        </div>
    </aside>
</template>