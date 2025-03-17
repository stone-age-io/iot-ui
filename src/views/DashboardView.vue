<!-- src/views/DashboardView.vue -->
<template>
  <div>
    <h1 class="page-header">Dashboard</h1>
    
    <!-- Status Cards -->
    <div class="space-y-3 mb-5">
      <!-- Edges Card -->
      <div class="card dashboard-card p-4 bg-white rounded-lg shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
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
            class="dashboard-link text-blue-600 hover:text-blue-800"
          >
            View all
            <i class="pi pi-arrow-right ml-1 text-xs"></i>
          </router-link>
        </div>
      </div>
      
      <!-- Locations Card -->
      <div class="card dashboard-card p-4 bg-white rounded-lg shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
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
            class="dashboard-link text-green-600 hover:text-green-800"
          >
            View all
            <i class="pi pi-arrow-right ml-1 text-xs"></i>
          </router-link>
        </div>
      </div>
      
      <!-- Things Card -->
      <div class="card dashboard-card p-4 bg-white rounded-lg shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
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
            class="dashboard-link text-purple-600 hover:text-purple-800"
          >
            View all
            <i class="pi pi-arrow-right ml-1 text-xs"></i>
          </router-link>
        </div>
      </div>
      
      <!-- Users Card -->
      <div class="card dashboard-card p-4 bg-white rounded-lg shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
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
            class="dashboard-link text-orange-600 hover:text-orange-800"
          >
            View all
            <i class="pi pi-arrow-right ml-1 text-xs"></i>
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="card p-4 mb-4">
      <h2 class="text-lg font-semibold mb-3">Recent Activity</h2>
      
      <div v-if="loading" class="flex justify-center my-4">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      
      <div v-else-if="activity.length === 0" class="text-gray-500 text-center py-4">
        No recent activity found.
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="(item, index) in activity"
          :key="index"
          class="flex py-2 border-b border-gray-100 last:border-0"
        >
          <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
            <i :class="activityIcon(item.type)" class="text-gray-600"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm sm:text-base">{{ item.title }}</div>
            <div class="text-xs sm:text-sm text-gray-500">{{ item.timestamp }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Grafana Link (simplified for mobile) -->
    <div class="card p-4">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <i class="pi pi-chart-line text-blue-600"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-medium">Analytics & Dashboards</h2>
          <p class="text-sm text-gray-500 hidden sm:block">View metrics in Grafana</p>
        </div>
        <Button
          icon="pi pi-external-link"
          label="Open"
          class="p-button-sm whitespace-nowrap"
          @click="openGrafana"
        />
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
