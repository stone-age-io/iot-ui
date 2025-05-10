// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCacheStore } from '../stores/cacheStore'

// Layouts
import DefaultLayout from '../layouts/DefaultLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

// Auth Views
import LoginView from '../views/Auth/LoginView.vue'

// Dashboard & Map Views
import DashboardView from '../views/DashboardView.vue'
import MapView from '../views/MapView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import PubSubView from '../views/PubSubView.vue'

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

// Messaging Client Views
import ClientListView from '../views/Messaging/Clients/ClientListView.vue'
import ClientDetailView from '../views/Messaging/Clients/ClientDetailView.vue'
import ClientCreateView from '../views/Messaging/Clients/ClientCreateView.vue'
import ClientEditView from '../views/Messaging/Clients/ClientEditView.vue'

// Topic Permission Views
import TopicPermissionListView from '../views/Messaging/TopicPermissions/TopicPermissionListView.vue'
import TopicPermissionDetailView from '../views/Messaging/TopicPermissions/TopicPermissionDetailView.vue'
import TopicPermissionCreateView from '../views/Messaging/TopicPermissions/TopicPermissionCreateView.vue'
import TopicPermissionEditView from '../views/Messaging/TopicPermissions/TopicPermissionEditView.vue'

// Profile View
import ProfileView from '../views/Profile/ProfileView.vue'

// Settings View - New
import UserSettingsView from '../views/Settings/UserSettingsView.vue'

// Organization Views
import OrganizationListView from '../views/Organizations/OrganizationListView.vue'
import OrganizationDetailView from '../views/Organizations/OrganizationDetailView.vue'
import OrganizationCreateView from '../views/Organizations/OrganizationCreateView.vue'
import OrganizationEditView from '../views/Organizations/OrganizationEditView.vue'

import EdgeTypeListView from '../views/Types/EdgeTypes/EdgeTypeListView.vue'
import EdgeTypeDetailView from '../views/Types/EdgeTypes/EdgeTypeDetailView.vue'
import EdgeTypeCreateView from '../views/Types/EdgeTypes/EdgeTypeCreateView.vue'
import EdgeTypeEditView from '../views/Types/EdgeTypes/EdgeTypeEditView.vue'

import EdgeRegionListView from '../views/Types/EdgeRegions/EdgeRegionListView.vue'
import EdgeRegionDetailView from '../views/Types/EdgeRegions/EdgeRegionDetailView.vue'
import EdgeRegionCreateView from '../views/Types/EdgeRegions/EdgeRegionCreateView.vue'
import EdgeRegionEditView from '../views/Types/EdgeRegions/EdgeRegionEditView.vue'

import LocationTypeListView from '../views/Types/LocationTypes/LocationTypeListView.vue'
import LocationTypeDetailView from '../views/Types/LocationTypes/LocationTypeDetailView.vue'
import LocationTypeCreateView from '../views/Types/LocationTypes/LocationTypeCreateView.vue'
import LocationTypeEditView from '../views/Types/LocationTypes/LocationTypeEditView.vue'

import ThingTypeListView from '../views/Types/ThingTypes/ThingTypeListView.vue'
import ThingTypeDetailView from '../views/Types/ThingTypes/ThingTypeDetailView.vue'
import ThingTypeCreateView from '../views/Types/ThingTypes/ThingTypeCreateView.vue'
import ThingTypeEditView from '../views/Types/ThingTypes/ThingTypeEditView.vue'

/**
 * Route to collection mapping for cache store
 * Maps route paths to their corresponding collection names
 */
const ROUTE_TO_COLLECTION_MAP = {
  // Entity collections
  'edges': 'edges',
  'locations': 'locations',
  'things': 'things',
  
  // Messaging collections
  'messaging/clients': 'clients',
  'messaging/permissions': 'topic_permissions',
  
  // Type collections
  'types/edge-types': 'edge_types',
  'types/edge-regions': 'edge_regions',
  'types/location-types': 'location_types',
  'types/thing-types': 'thing_types',
  
  // Organization collection
  'organizations': 'organizations'
};

/**
 * Detect collection name from route path
 * @param {string} path - Route path
 * @returns {string|null} - Detected collection name or null
 */
function detectCollectionFromPath(path) {
  // Remove leading slash and split by slashes
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Check direct matches first (e.g., /edges, /locations)
  const firstSegment = normalizedPath.split('/')[0];
  if (ROUTE_TO_COLLECTION_MAP[firstSegment]) {
    return ROUTE_TO_COLLECTION_MAP[firstSegment];
  }
  
  // Check composite paths (e.g., /types/edge-types, /messaging/clients)
  for (const [routePath, collectionName] of Object.entries(ROUTE_TO_COLLECTION_MAP)) {
    if (normalizedPath.startsWith(routePath)) {
      return collectionName;
    }
  }
  
  // No matching collection found
  return null;
}

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
        {
          path: 'map',
          name: 'map',
          component: MapView,
          meta: { title: 'Locations Map' }
        },
	{
	  path: 'pubsub',
	  name: 'pubsub',
	  component: PubSubView,
	  meta: { title: 'Pub/Sub' }
	},
        // Profile route
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
          meta: { title: 'My Profile' }
        },
        // Settings route - New
        {
          path: 'settings',
          name: 'settings',
          component: UserSettingsView,
          meta: { title: 'User Settings' }
        },
        // Edge routes
        {
          path: 'edges',
          name: 'edges',
          component: EdgeListView,
          meta: { title: 'Edges', collection: 'edges' }
        },
        {
          path: 'edges/create',
          name: 'create-edge',
          component: EdgeCreateView,
          meta: { title: 'Create Edge', collection: 'edges' }
        },
        {
          path: 'edges/:id',
          name: 'edge-detail',
          component: EdgeDetailView,
          meta: { title: 'Edge Details', collection: 'edges' }
        },
        {
          path: 'edges/:id/edit',
          name: 'edit-edge',
          component: EdgeEditView,
          meta: { title: 'Edit Edge', collection: 'edges' }
        },
        
        // Location routes
        {
          path: 'locations',
          name: 'locations',
          component: LocationListView,
          meta: { title: 'Locations', collection: 'locations' }
        },
        {
          path: 'locations/create',
          name: 'create-location',
          component: LocationCreateView,
          meta: { title: 'Create Location', collection: 'locations' }
        },
        {
          path: 'locations/:id',
          name: 'location-detail',
          component: LocationDetailView,
          meta: { title: 'Location Details', collection: 'locations' }
        },
        {
          path: 'locations/:id/edit',
          name: 'edit-location',
          component: LocationEditView,
          meta: { title: 'Edit Location', collection: 'locations' }
        },
        
        // Thing routes
        {
          path: 'things',
          name: 'things',
          component: ThingListView,
          meta: { title: 'Things', collection: 'things' }
        },
        {
          path: 'things/create',
          name: 'create-thing',
          component: ThingCreateView,
          meta: { title: 'Create Thing', collection: 'things' }
        },
        {
          path: 'things/:id',
          name: 'thing-detail',
          component: ThingDetailView,
          meta: { title: 'Thing Details', collection: 'things' }
        },
        {
          path: 'things/:id/edit',
          name: 'edit-thing',
          component: ThingEditView,
          meta: { title: 'Edit Thing', collection: 'things' }
        },
        
        // Client routes (for Messaging)
        {
          path: 'messaging/clients',
          name: 'clients',
          component: ClientListView,
          meta: { title: 'Messaging Clients', collection: 'clients' }
        },
        {
          path: 'messaging/clients/create',
          name: 'create-client',
          component: ClientCreateView,
          meta: { title: 'Create Client', collection: 'clients' }
        },
        {
          path: 'messaging/clients/:id',
          name: 'client-detail',
          component: ClientDetailView,
          meta: { title: 'Client Details', collection: 'clients' }
        },
        {
          path: 'messaging/clients/:id/edit',
          name: 'edit-client',
          component: ClientEditView,
          meta: { title: 'Edit Client', collection: 'clients' }
        },
        
        // Topic Permission routes (for Messaging)
        {
          path: 'messaging/permissions',
          name: 'topic-permissions',
          component: TopicPermissionListView,
          meta: { title: 'Topic Permissions', collection: 'topic_permissions' }
        },
        {
          path: 'messaging/permissions/create',
          name: 'create-topic-permission',
          component: TopicPermissionCreateView,
          meta: { title: 'Create Topic Permission', collection: 'topic_permissions' }
        },
        {
          path: 'messaging/permissions/:id',
          name: 'topic-permission-detail',
          component: TopicPermissionDetailView,
          meta: { title: 'Topic Permission Details', collection: 'topic_permissions' }
        },
        {
          path: 'messaging/permissions/:id/edit',
          name: 'edit-topic-permission',
          component: TopicPermissionEditView,
          meta: { title: 'Edit Topic Permission', collection: 'topic_permissions' }
        },
        
        // Organization routes
        {
          path: 'organizations',
          name: 'organizations',
          component: OrganizationListView,
          meta: { title: 'Organizations', collection: 'organizations' }
        },
        {
          path: 'organizations/create',
          name: 'create-organization',
          component: OrganizationCreateView,
          meta: { title: 'Create Organization', collection: 'organizations' }
        },
        {
          path: 'organizations/:id',
          name: 'organization-detail',
          component: OrganizationDetailView,
          meta: { title: 'Organization Details', collection: 'organizations' }
        },
        {
          path: 'organizations/:id/edit',
          name: 'edit-organization',
          component: OrganizationEditView,
          meta: { title: 'Edit Organization', collection: 'organizations' }
        },
        
        {
          path: 'types/edge-types',
          name: 'edge-types',
          component: EdgeTypeListView,
          meta: { title: 'Edge Types', collection: 'edge_types' }
        },
        {
          path: 'types/edge-types/create',
          name: 'create-edge-type',
          component: EdgeTypeCreateView,
          meta: { title: 'Create Edge Type', collection: 'edge_types' }
        },
        {
          path: 'types/edge-types/:id',
          name: 'edge-type-detail',
          component: EdgeTypeDetailView,
          meta: { title: 'Edge Type Details', collection: 'edge_types' }
        },
        {
          path: 'types/edge-types/:id/edit',
          name: 'edit-edge-type',
          component: EdgeTypeEditView,
          meta: { title: 'Edit Edge Type', collection: 'edge_types' }
        },

        // Edge Region routes
        {
          path: 'types/edge-regions',
          name: 'edge-regions',
          component: EdgeRegionListView,
          meta: { title: 'Edge Regions', collection: 'edge_regions' }
        },
        {
          path: 'types/edge-regions/create',
          name: 'create-edge-region',
          component: EdgeRegionCreateView,
          meta: { title: 'Create Edge Region', collection: 'edge_regions' }
        },
        {
          path: 'types/edge-regions/:id',
          name: 'edge-region-detail',
          component: EdgeRegionDetailView,
          meta: { title: 'Edge Region Details', collection: 'edge_regions' }
        },
        {
          path: 'types/edge-regions/:id/edit',
          name: 'edit-edge-region',
          component: EdgeRegionEditView,
          meta: { title: 'Edit Edge Region', collection: 'edge_regions' }
        },

        // Location Type routes
        {
          path: 'types/location-types',
          name: 'location-types',
          component: LocationTypeListView,
          meta: { title: 'Location Types', collection: 'location_types' }
        },
        {
          path: 'types/location-types/create',
          name: 'create-location-type',
          component: LocationTypeCreateView,
          meta: { title: 'Create Location Type', collection: 'location_types' }
        },
        {
          path: 'types/location-types/:id',
          name: 'location-type-detail',
          component: LocationTypeDetailView,
          meta: { title: 'Location Type Details', collection: 'location_types' }
        },
        {
          path: 'types/location-types/:id/edit',
          name: 'edit-location-type',
          component: LocationTypeEditView,
          meta: { title: 'Edit Location Type', collection: 'location_types' }
        },

        // Thing Type routes
        {
          path: 'types/thing-types',
          name: 'thing-types',
          component: ThingTypeListView,
          meta: { title: 'Thing Types', collection: 'thing_types' }
        },
        {
          path: 'types/thing-types/create',
          name: 'create-thing-type',
          component: ThingTypeCreateView,
          meta: { title: 'Create Thing Type', collection: 'thing_types' }
        },
        {
          path: 'types/thing-types/:id',
          name: 'thing-type-detail',
          component: ThingTypeDetailView,
          meta: { title: 'Thing Type Details', collection: 'thing_types' }
        },
        {
          path: 'types/thing-types/:id/edit',
          name: 'edit-thing-type',
          component: ThingTypeEditView,
          meta: { title: 'Edit Thing Type', collection: 'thing_types' }
        }
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

// Navigation guard to check authentication AND update cache store with current collection
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Set document title
  document.title = to.meta.title 
    ? `${to.meta.title} | Stone-Age.io` 
    : 'IoT Platform'

  // Handle auth check
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // Update cache store with current collection if authenticated
  if (authStore.isAuthenticated) {
    try {
      const cacheStore = useCacheStore()
      
      // First check if route has collection in meta
      let currentCollection = to.meta.collection || null
      
      // If not set in meta, try to detect from path
      if (!currentCollection) {
        currentCollection = detectCollectionFromPath(to.path)
      }
      
      // Update cache store with current collection
      if (currentCollection) {
        cacheStore.setCurrentCollection(currentCollection)
      }
    } catch (error) {
      console.warn('Failed to update cache store with current collection:', error)
    }
  }
  
  next()
})

// Add afterEach hook to reset scroll position
router.afterEach((to, from) => {
  // Scroll to top when navigating to a new page
  if (to.name !== from.name) {
    window.scrollTo(0, 0)
  }
  
  // Check for skipCache parameter and remove it after a delay
  if (to.query.skipCache) {
    setTimeout(() => {
      const query = { ...to.query }
      delete query.skipCache
      router.replace({ path: to.path, query }).catch(err => {
        // Ignore redundant navigation errors
        if (err.name !== 'NavigationDuplicated') {
          throw err
        }
      })
    }, 1000)
  }
})

export default router
