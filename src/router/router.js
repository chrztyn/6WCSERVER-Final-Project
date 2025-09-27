import { createRouter, createWebHistory } from 'vue-router';

import AppLayout from '../components/AppLayout.vue';
import Dashboard from '../pages/Dashboard.vue';
import Group from '../pages/Group.vue';
import GroupExpenseList from '../pages/GroupExpenseList.vue';
import Reports from '../pages/Reports.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'Dashboard', component: Dashboard },
        { path: 'group', name: 'Group', component: Group },
        { path: 'group/:id', name: 'GroupExpenseList', component: GroupExpenseList },
        { path: 'reports', name: 'Reports', component: Reports },
      ],
    },
  ],
});

export default router;