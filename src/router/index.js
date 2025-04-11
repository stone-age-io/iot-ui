// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Layouts
import DefaultLayout from '../layouts/DefaultLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

// Auth Views
import LoginView from '../views/Auth/LoginView.vue'

// Dashboard & Map Views
import DashboardView from '../views/DashboardView.vue'
import MapView from '../views/MapView.vue'
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
        
        // Client routes (for Messaging)
        {
          path: 'messaging/clients',
          name: 'clients',
          component: ClientListView,
          meta: { title: 'Messaging Clients' }
        },
        {
          path: 'messaging/clients/create',
          name: 'create-client',
          component: ClientCreateView,
          meta: { title: 'Create Client' }
        },
        {
          path: 'messaging/clients/:id',
          name: 'client-detail',
          component: ClientDetailView,
          meta: { title: 'Client Details' }
        },
        {
          path: 'messaging/clients/:id/edit',
          name: 'edit-client',
          component: ClientEditView,
          meta: { title: 'Edit Client' }
        },
        
        // Topic Permission routes (for Messaging)
        {
          path: 'messaging/permissions',
          name: 'topic-permissions',
          component: TopicPermissionListView,
          meta: { title: 'Topic Permissions' }
        },
        {
          path: 'messaging/permissions/create',
          name: 'create-topic-permission',
          component: TopicPermissionCreateView,
          meta: { title: 'Create Topic Permission' }
        },
        {
          path: 'messaging/permissions/:id',
          name: 'topic-permission-detail',
          component: TopicPermissionDetailView,
          meta: { title: 'Topic Permission Details' }
        },
        {
          path: 'messaging/permissions/:id/edit',
          name: 'edit-topic-permission',
          component: TopicPermissionEditView,
          meta: { title: 'Edit Topic Permission' }
        },
        {
    	  path: 'types/edge-types',
          name: 'edge-types',
          component: EdgeTypeListView,
          meta: { title: 'Edge Types' }
	},
  	{
        path: 'types/edge-types/create',
        name: 'create-edge-type',
        component: EdgeTypeCreateView,
        meta: { title: 'Create Edge Type' }
        },
  	{
        path: 'types/edge-types/:id',
        name: 'edge-type-detail',
        component: EdgeTypeDetailView,
        meta: { title: 'Edge Type Details' }
        },
  	{
  	path: 'types/edge-types/:id/edit',
  	name: 'edit-edge-type',
  	component: EdgeTypeEditView,
  	meta: { title: 'Edit Edge Type' }
	},

	// Edge Region routes
	{
  	path: 'types/edge-regions',
  	name: 'edge-regions',
  	component: EdgeRegionListView,
  	meta: { title: 'Edge Regions' }
	},
	{
  	path: 'types/edge-regions/create',
  	name: 'create-edge-region',
  	component: EdgeRegionCreateView,
  	meta: { title: 'Create Edge Region' }
	},
	{
  	path: 'types/edge-regions/:id',
  	name: 'edge-region-detail',
  	component: EdgeRegionDetailView,
  	meta: { title: 'Edge Region Details' }
	},
	{
  	path: 'types/edge-regions/:id/edit',
  	name: 'edit-edge-region',
  	component: EdgeRegionEditView,
  	meta: { title: 'Edit Edge Region' }
	},

	// Location Type routes
	{
  	path: 'types/location-types',
  	name: 'location-types',
  	component: LocationTypeListView,
  	meta: { title: 'Location Types' }
	},
	{
  	path: 'types/location-types/create',
  	name: 'create-location-type',
  	component: LocationTypeCreateView,
  	meta: { title: 'Create Location Type' }
	},
	{
  	path: 'types/location-types/:id',
  	name: 'location-type-detail',
  	component: LocationTypeDetailView,
  	meta: { title: 'Location Type Details' }
	},
	{
  	path: 'types/location-types/:id/edit',
  	name: 'edit-location-type',
  	component: LocationTypeEditView,
  	meta: { title: 'Edit Location Type' }
	},

	// Thing Type routes
	{
  	path: 'types/thing-types',
  	name: 'thing-types',
  	component: ThingTypeListView,
  	meta: { title: 'Thing Types' }
	},
	{
  	path: 'types/thing-types/create',
  	name: 'create-thing-type',
  	component: ThingTypeCreateView,
  	meta: { title: 'Create Thing Type' }
	},
	{
  	path: 'types/thing-types/:id',
  	name: 'thing-type-detail',
  	component: ThingTypeDetailView,
  	meta: { title: 'Thing Type Details' }
	},
	{
  	path: 'types/thing-types/:id/edit',
  	name: 'edit-thing-type',
  	component: ThingTypeEditView,
  	meta: { title: 'Edit Thing Type' }
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
