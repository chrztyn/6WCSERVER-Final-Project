<script>
import Sidebar from "./Sidebar.vue";
import Topbar from "./Topbar.vue";
import GroupListOverlay from "./GroupListOverlay.vue";

export default {
    name: "AppLayout",
    components: { Sidebar, Topbar, GroupListOverlay },
    data() {
        return {
            showGroupList: false
        };
    },
    methods: {
        openGroupList() {
            this.showGroupList = true;
        },
        closeGroupList() {
            this.showGroupList = false;
            this.$refs.sidebar?.resetActiveState();
        },
        selectGroup(group) {
            console.log('Selected group:', group);
            this.$router.push(`/group/${group.id}`);
            this.closeGroupList();
        },
        toggleSidebarMenu() {
            this.$refs.sidebar.toggleMobileMenu();
        }
    },
    provide() {
        return {
            openGroupList: this.openGroupList
        };
    }
};
</script>

<template>
    <div class="flex min-h-screen w-full">
        <Sidebar ref="sidebar" />
        
        <section class="flex-1 min-w-0">
        <!-- Listen for the emitted event -->
        <Topbar @toggle-sidebar="toggleSidebarMenu" />
        <router-view />
        </section>

        <!-- Group List Overlay -->
        <GroupListOverlay 
        :is-open="showGroupList"
        @close="closeGroupList"
        @select-group="selectGroup"
        />
    </div>
</template>

