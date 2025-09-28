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

// Function to check if user is authenticated
// Replace this with your actual authentication logic
const isAuthenticated = () => {
  // Check for token (you're storing it as 'token', not 'authToken')
  const token = localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    return true;
  }
  
  // Fallback: Check for user data
  const user = localStorage.getItem('user');
  if (user && user !== 'null' && user !== 'undefined') {
    try {
      const userData = JSON.parse(user);
      return userData && userData.id;
    } catch (e) {
      return false;
    }
  }
  
  return false;
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Authentication routes (outside of AppLayout)
    {
      path: '/landing',
      name: 'Landing',
      component: Landing,
      meta: { requiresGuest: true }, // Only accessible when not logged in
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
    // Main application routes (inside AppLayout)
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true }, // Requires authentication
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'Dashboard', component: Dashboard },
        { path: 'group', name: 'Group', component: Group },
        { path: 'group/:id', name: 'GroupExpenseList', component: GroupExpenseList },
        { path: 'reports', name: 'Reports', component: Reports },
        { path: 'profile', name: 'Profile', component: Profile },
      ],
    },
  ],
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated();
  
  // Debug logging - remove this in production
  console.log('Navigation guard:', {
    to: to.path,
    from: from.path,
    authenticated,
    token: localStorage.getItem('token'), // Changed from 'authToken' to 'token'
    user: localStorage.getItem('user')
  });

  // Handle legacy /app redirect
  if (to.path === '/app' && authenticated) {
    next('/dashboard');
    return;
  }

  // If route requires authentication and user is not authenticated
  if (to.meta.requiresAuth && !authenticated) {
    console.log('Redirecting to landing - not authenticated');
    next('/landing');
  }
  // If route requires guest (not logged in) and user is authenticated
  else if (to.meta.requiresGuest && authenticated) {
    console.log('Redirecting to dashboard - already authenticated');
    next('/dashboard');
  }
  // Otherwise, proceed normally
  else {
    console.log('Proceeding to route');
    next();
  }
});

export default router;