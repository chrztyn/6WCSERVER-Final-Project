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
            // Reset sidebar active state when overlay closes
            this.$refs.sidebar?.resetActiveState();
        },
        selectGroup(group) {
            console.log('Selected group:', group);
            // Here you can add navigation to the specific group page
            // this.$router.push(`/group/${group.id}`);
            this.closeGroupList();
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
            <Topbar />
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

<style scoped>
/* Styles are now handled by GroupListOverlay component */
</style>

