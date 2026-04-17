import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
     
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/Home',
      name: 'home-landing',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/AiSupport',
      name: 'aisupport',
     
      component: () => import('../views/AiSupport.vue'),
    },
    {
      path: '/Wellness',
      name: 'wellness',
     
      component: () => import('../views/Wellness.vue'),
    },
    {
      path: '/Breathing',
      name: 'breathing',
     
      component: () => import('../views/Breathing.vue'),
    },
  ],
})

export default router
