import { createRouter, createWebHistory } from 'vue-router';

// Authentication pages
import Landing from '../pages/Landing.vue';
import Login from '../pages/Login.vue';
import SignUp from '../pages/SignUp.vue';

// Main app components
import AppLayout from '../components/AppLayout.vue';
import Dashboard from '../pages/Dashboard.vue';
import Group from '../pages/Group.vue';
import GroupExpenseList from '../pages/GroupExpenseList.vue';
import Reports from '../pages/Reports.vue';
import Profile from '../pages/Profile.vue';
import TransactionHistory from '../pages/TransactionHistory.vue';

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return false;
  }
  
  try {
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/landing',
      name: 'Landing',
      component: Landing,
      meta: { requiresGuest: true }, 
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { requiresGuest: true },
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: SignUp,
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'Dashboard', component: Dashboard },
        { path: 'group', name: 'Group', component: Group },
        { path: 'group/:id', name: 'GroupExpenseList', component: GroupExpenseList },
        { path: 'reports', name: 'Reports', component: Reports },
        { path: 'profile', name: 'Profile', component: Profile },
        { 
          path: 'transaction/:id?', 
          name: 'TransactionHistory', 
          component: TransactionHistory 
        }
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: (to) => {
        return isAuthenticated() ? '/dashboard' : '/landing';
      }
    }
  ],
});

router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated();

  console.log('Navigation guard:', {
    to: to.path,
    from: from.path,
    authenticated,
    token: localStorage.getItem('token') ? '***exists***' : null,
  });

  if (to.path === '/app') {
    if (authenticated) {
      console.log('Redirecting /app to /dashboard');
      next('/dashboard');
    } else {
      console.log('Redirecting /app to /landing - not authenticated');
      next('/landing');
    }
    return;
  }

  if (to.meta.requiresAuth && !authenticated) {
    console.log('Redirecting to landing - no token found');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    next('/landing');
    return;
  }

  if (to.meta.requiresGuest && authenticated) {
    console.log('Redirecting to dashboard - already authenticated');
    next('/dashboard');
    return;
  }

  if (to.path === '/' && !authenticated) {
    console.log('Redirecting root to landing - not authenticated');
    next('/landing');
    return;
  }

  console.log('Proceeding to route');
  next();
});

export default router;