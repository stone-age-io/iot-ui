// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Layouts
import DefaultLayout from '../layouts/DefaultLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

// Auth Views
import LoginView from '../views/Auth/LoginView.vue'

// Dashboard View
import DashboardView from '../views/DashboardView.vue'
import NotFoundView from '../views/NotFoundView.vue'

// Edge Views
import EdgeListView from '../views/Entities/Edges/EdgeListView.vue'
import EdgeDetailView from '../views/Entities/Edges/EdgeDetailView.vue'
import EdgeCreateView from '../views/Entities/Edges/EdgeCreateView.vue'
import EdgeEditView from '../views/Entities/Edges/EdgeEditView.vue'

// Location Views
import LocationListView from '../views/Entities/Locations/LocationsListView.vue'
import LocationDetailView from '../views/Entities/Locations/LocationDetailView.vue'
import LocationCreateView from '../views/Entities/Locations/LocationCreateView.vue'
import LocationEditView from '../views/Entities/Locations/LocationEditView.vue'

// Thing Views
import ThingListView from '../views/Entities/Things/ThingListView.vue'
import ThingDetailView from '../views/Entities/Things/ThingDetailView.vue'
import ThingCreateView from '../views/Entities/Things/ThingCreateView.vue'
import ThingEditView from '../views/Entities/Things/ThingEditView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
          meta: { title: 'Dashboard' }
        },
        // Edge routes
        {
          path: 'edges',
          name: 'edges',
          component: EdgeListView,
          meta: { title: 'Edges' }
        },
        {
          path: 'edges/create',
          name: 'create-edge',
          component: EdgeCreateView,
          meta: { title: 'Create Edge' }
        },
        {
          path: 'edges/:id',
          name: 'edge-detail',
          component: EdgeDetailView,
          meta: { title: 'Edge Details' }
        },
        {
          path: 'edges/:id/edit',
          name: 'edit-edge',
          component: EdgeEditView,
          meta: { title: 'Edit Edge' }
        },
        
        // Location routes
        {
          path: 'locations',
          name: 'locations',
          component: LocationListView,
          meta: { title: 'Locations' }
        },
        {
          path: 'locations/create',
          name: 'create-location',
          component: LocationCreateView,
          meta: { title: 'Create Location' }
        },
        {
          path: 'locations/:id',
          name: 'location-detail',
          component: LocationDetailView,
          meta: { title: 'Location Details' }
        },
        {
          path: 'locations/:id/edit',
          name: 'edit-location',
          component: LocationEditView,
          meta: { title: 'Edit Location' }
        },
        
        // Thing routes
        {
          path: 'things',
          name: 'things',
          component: ThingListView,
          meta: { title: 'Things' }
        },
        {
          path: 'things/create',
          name: 'create-thing',
          component: ThingCreateView,
          meta: { title: 'Create Thing' }
        },
        {
          path: 'things/:id',
          name: 'thing-detail',
          component: ThingDetailView,
          meta: { title: 'Thing Details' }
        },
        {
          path: 'things/:id/edit',
          name: 'edit-thing',
          component: ThingEditView,
          meta: { title: 'Edit Thing' }
        },
        
        // MQTT users and roles routes will be added in the future
      ]
    },
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView,
          meta: { title: 'Login' }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      component: NotFoundView,
      meta: { title: 'Not Found' }
    }
  ]
})

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Set document title
  document.title = to.meta.title 
    ? `${to.meta.title} | IoT Platform` 
    : 'IoT Platform'

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
