import { createRouter, createWebHistory } from 'vue-router';

import Landing from '../pages/Landing.vue';
import Login from '../pages/Login.vue';
import SignUp from '../pages/SignUp.vue';


const routes = [
  {
    path: '/',
    name: 'Landing',
    component: Landing,
  },
  {
    path:'/login',
    name:'Login',
    component: Login,
  },
  {
    path:'/signup',
    name:'SignUp',
    component: SignUp,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;