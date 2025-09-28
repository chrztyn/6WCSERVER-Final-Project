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
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  
  // Only check for token - simplified and more reliable
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return false;
  }
  
  // Optional: Check if token is expired (if you store expiration)
  try {
    // If your JWT includes expiration, you could decode and check it here
    // For now, just assume token exists = authenticated
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
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
    // Catch-all route - redirect any unknown routes
    {
      path: '/:pathMatch(.*)*',
      redirect: (to) => {
        // If user is authenticated, redirect to dashboard
        // If not authenticated, redirect to landing
        return isAuthenticated() ? '/dashboard' : '/landing';
      }
    }
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
    token: localStorage.getItem('token') ? '***exists***' : null, // Hide token value for security
  });

  // Handle legacy /app redirect
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

  // CRITICAL: If no token and trying to access protected route
  if (to.meta.requiresAuth && !authenticated) {
    console.log('Redirecting to landing - no token found');
    // Clear any invalid data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    next('/landing');
    return;
  }

  // If authenticated user tries to access guest-only pages
  if (to.meta.requiresGuest && authenticated) {
    console.log('Redirecting to dashboard - already authenticated');
    next('/dashboard');
    return;
  }

  // If accessing root path without auth, redirect to landing
  if (to.path === '/' && !authenticated) {
    console.log('Redirecting root to landing - not authenticated');
    next('/landing');
    return;
  }

  // Otherwise, proceed normally
  console.log('Proceeding to route');
  next();
});

export default router;