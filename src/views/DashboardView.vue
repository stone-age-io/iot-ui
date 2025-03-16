<template>
  <div>
    <h1 class="page-header">Dashboard</h1>
    
    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Edges Card -->
      <div class="card p-4 bg-white rounded-lg shadow-sm flex flex-col">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <i class="pi pi-server text-blue-600"></i>
          </div>
          <div>
            <h3 class="text-gray-500 text-sm">Edges</h3>
            <div class="text-2xl font-semibold">{{ edgesCount }}</div>
          </div>
        </div>
        <router-link 
          to="/edges" 
          class="text-blue-600 text-sm hover:underline mt-auto flex items-center"
        >
          View all edges
          <i class="pi pi-arrow-right ml-1 text-xs"></i>
        </router-link>
      </div>
      
      <!-- Locations Card -->
      <div class="card p-4 bg-white rounded-lg shadow-sm flex flex-col">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <i class="pi pi-map-marker text-green-600"></i>
          </div>
          <div>
            <h3 class="text-gray-500 text-sm">Locations</h3>
            <div class="text-2xl font-semibold">{{ locationsCount }}</div>
          </div>
        </div>
        <router-link 
          to="/locations" 
          class="text-green-600 text-sm hover:underline mt-auto flex items-center"
        >
          View all locations
          <i class="pi pi-arrow-right ml-1 text-xs"></i>
        </router-link>
      </div>
      
      <!-- Things Card -->
      <div class="card p-4 bg-white rounded-lg shadow-sm flex flex-col">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <i class="pi pi-wifi text-purple-600"></i>
          </div>
          <div>
            <h3 class="text-gray-500 text-sm">Things</h3>
            <div class="text-2xl font-semibold">{{ thingsCount }}</div>
          </div>
        </div>
        <router-link 
          to="/things" 
          class="text-purple-600 text-sm hover:underline mt-auto flex items-center"
        >
          View all things
          <i class="pi pi-arrow-right ml-1 text-xs"></i>
        </router-link>
      </div>
      
      <!-- Users Card -->
      <div class="card p-4 bg-white rounded-lg shadow-sm flex flex-col">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
            <i class="pi pi-users text-orange-600"></i>
          </div>
          <div>
            <h3 class="text-gray-500 text-sm">MQTT Users</h3>
            <div class="text-2xl font-semibold">{{ mqttUsersCount }}</div>
          </div>
        </div>
        <router-link 
          to="/mqtt-users" 
          class="text-orange-600 text-sm hover:underline mt-auto flex items-center"
        >
          View all users
          <i class="pi pi-arrow-right ml-1 text-xs"></i>
        </router-link>
      </div>
    </div>
    
    <!-- Recent Activity and Grafana -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Activity -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Recent Activity</h2>
        
        <div v-if="loading" class="flex justify-center my-6">
          <ProgressSpinner style="width: 50px; height: 50px" />
        </div>
        
        <div v-else-if="activity.length === 0" class="text-gray-500 text-center py-6">
          No recent activity found.
        </div>
        
        <div v-else class="space-y-4">
          <div
            v-for="(item, index) in activity"
            :key="index"
            class="flex items-start border-b border-gray-100 pb-3 last:border-0"
          >
            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <i :class="activityIcon(item.type)" class="text-gray-600"></i>
            </div>
            <div>
              <div class="font-medium">{{ item.title }}</div>
              <div class="text-sm text-gray-500">{{ item.timestamp }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Grafana Link -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Analytics & Dashboards</h2>
        
        <div class="bg-gray-50 rounded-lg p-6 text-center">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-chart-line text-blue-600 text-2xl"></i>
          </div>
          
          <h3 class="text-lg font-medium mb-2">Grafana Dashboards</h3>
          <p class="text-gray-600 mb-4">
            View detailed analytics, metrics, and visualizations in Grafana.
          </p>
          
          <Button
            label="Open Grafana"
            icon="pi pi-external-link"
            class="p-button-primary"
            @click="openGrafana"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiHelpers } from '../services/api'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'

// Mock data for prototype UI
const edgesCount = ref(0)
const locationsCount = ref(0)
const thingsCount = ref(0)
const mqttUsersCount = ref(0)
const activity = ref([])
const loading = ref(true)

// Fetch dashboard data
onMounted(async () => {
  try {
    loading.value = true
    
    // In a real implementation, these would be actual API calls
    // For now, we're simulating with setTimeout
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data
    edgesCount.value = 12
    locationsCount.value = 48
    thingsCount.value = 156
    mqttUsersCount.value = 23
    
    activity.value = [
      {
        type: 'login',
        title: 'Admin user logged in',
        timestamp: '10 minutes ago'
      },
      {
        type: 'create',
        title: 'New edge "bld-eu-003" created',
        timestamp: '2 hours ago'
      },
      {
        type: 'update',
        title: 'Thing "rdr-main-001" updated',
        timestamp: '4 hours ago'
      },
      {
        type: 'error',
        title: 'Failed login attempt from 192.168.1.42',
        timestamp: 'Yesterday at 18:45'
      }
    ]
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
})

// Activity icon helper
const activityIcon = (type) => {
  switch (type) {
    case 'login': return 'pi pi-sign-in'
    case 'create': return 'pi pi-plus'
    case 'update': return 'pi pi-pencil'
    case 'delete': return 'pi pi-trash'
    case 'error': return 'pi pi-exclamation-triangle'
    default: return 'pi pi-info-circle'
  }
}

// Open Grafana
const openGrafana = () => {
  window.open(import.meta.env.VITE_GRAFANA_URL || 'https://grafana.domain.com', '_blank')
}
</script>
