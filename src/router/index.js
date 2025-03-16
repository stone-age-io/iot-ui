import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Layouts
import DefaultLayout from '../layouts/DefaultLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

// Auth Views
import LoginView from '../views/Auth/LoginView.vue'

// Views
import DashboardView from '../views/DashboardView.vue'
import NotFoundView from '../views/NotFoundView.vue'

// Edge Views
import EdgeListView from '../views/Entities/Edges/EdgeListView.vue'
import EdgeDetailView from '../views/Entities/Edges/EdgeDetailView.vue'
import EdgeCreateView from '../views/Entities/Edges/EdgeCreateView.vue'
import EdgeEditView from '../views/Entities/Edges/EdgeEditView.vue'

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
        // Other entity routes will be added here in Phase 2
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
