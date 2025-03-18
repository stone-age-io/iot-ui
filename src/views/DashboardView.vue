// src/views/DashboardView.vue
<template>
  <div class="dashboard">
    <h1 class="page-header">Dashboard</h1>
    
    <!-- Status Cards Grid -->
    <div class="grid-cols-dashboard mb-8">
      <StatCard
        v-for="(card, index) in statCards"
        :key="index"
        :label="card.label"
        :value="card.value"
        :icon="card.icon"
        :color="card.color"
        :link-to="card.linkTo"
      />
    </div>
    
    <!-- Recent Activity -->
    <DashboardCard title="Recent Activity">
      <div v-if="loading" class="empty-state">
        <ProgressSpinner style="width: 24px; height: 24px" />
      </div>
      
      <div v-else-if="activity.length === 0" class="empty-state">
        No recent activity found.
      </div>
      
      <div v-else class="activity-feed">
        <ActivityItem
          v-for="(item, index) in activity"
          :key="index"
          :type="item.type"
          :title="item.title"
          :time="item.timestamp"
        />
      </div>
    </DashboardCard>
    
    <!-- Integrations -->
    <DashboardCard>
      <div class="flex items-center">
        <div class="icon-md icon-container icon-blue mr-4">
          <i class="pi pi-chart-line"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-base font-medium text-gray-900">Analytics & Dashboards</div>
          <div class="text-sm text-gray-500 hidden sm:block mt-1">View metrics in Grafana</div>
        </div>
        <Button
          label="Open"
          icon="pi pi-external-link"
          class="p-button-sm"
          @click="openGrafana"
        />
      </div>
    </DashboardCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiService from '../services/api'
import StatCard from '../components/dashboard/StatCard.vue'
import ActivityItem from '../components/dashboard/ActivityItem.vue'
import DashboardCard from '../components/dashboard/DashboardCard.vue'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'

// State management
const edgesCount = ref(0)
const locationsCount = ref(0)
const thingsCount = ref(0)
const clientsCount = ref(0)
const activity = ref([])
const loading = ref(true)

// Computed stat cards for better maintainability
const statCards = computed(() => [
  {
    label: 'Edges',
    value: edgesCount.value,
    icon: 'pi pi-server',
    color: 'blue',
    linkTo: '/edges'
  },
  {
    label: 'Locations',
    value: locationsCount.value,
    icon: 'pi pi-map-marker',
    color: 'green',
    linkTo: '/locations'
  },
  {
    label: 'Things',
    value: thingsCount.value,
    icon: 'pi pi-wifi',
    color: 'purple',
    linkTo: '/things'
  },
  {
    label: 'Clients',
    value: clientsCount.value,
    icon: 'pi pi-users',
    color: 'orange',
    linkTo: '/messaging/clients'
  }
])

// Fetch dashboard data
onMounted(async () => {
  await fetchDashboardData()
  await fetchActivityData()
})

// Fetch dashboard statistics
const fetchDashboardData = async () => {
  try {
    loading.value = true
    
    // If the stats API isn't available, fetch individual counts
    const [edgesResponse, locationsResponse, thingsResponse, clientsResponse] = await Promise.all([
      apiService.get('/pb/api/collections/edges/records?perPage=1'),
      apiService.get('/pb/api/collections/locations/records?perPage=1'),
      apiService.get('/pb/api/collections/things/records?perPage=1'),
      apiService.get('/pb/api/collections/clients/records?perPage=1')
    ])
    
    edgesCount.value = edgesResponse.data.totalItems || 0
    locationsCount.value = locationsResponse.data.totalItems || 0
    thingsCount.value = thingsResponse.data.totalItems || 0
    clientsCount.value = clientsResponse.data.totalItems || 0
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Set fallback values if API calls fail
    edgesCount.value = 0
    locationsCount.value = 0
    thingsCount.value = 0
    clientsCount.value = 0
  } finally {
    loading.value = false
  }
}

// Fetch recent activity data from PocketBase logs
const fetchActivityData = async () => {
  try {
    // Use PocketBase logs endpoint with sorting and limits
    const response = await apiService.get('/pb/api/logs?sort=-created&perPage=5')
    
    if (response.data && response.data.items && response.data.items.length > 0) {
      // Transform logs to activity items
      activity.value = response.data.items.map(log => {
        // Determine activity type based on log level and message
        const type = getActivityTypeFromLog(log)
        
        return {
          type,
          title: formatLogMessage(log),
          timestamp: formatTimestamp(log.created)
        }
      })
    } else {
      // Use mock data if no logs found
      console.warn('No logs found, using mock data')
      useMockActivityData()
    }
  } catch (error) {
    console.error('Error fetching logs:', error)
    useMockActivityData()
  }
}

// Determine activity type based on log level
const getActivityTypeFromLog = (log) => {
  // PocketBase log levels: 0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR
  switch (log.level) {
    case 3: return 'error'
    case 2: return 'warning'
    case 1: 
      if (log.message.toLowerCase().includes('created')) return 'create'
      if (log.message.toLowerCase().includes('updated')) return 'update'
      if (log.message.toLowerCase().includes('deleted')) return 'delete'
      if (log.message.toLowerCase().includes('login')) return 'login'
      return 'info'
    default: return 'info'
  }
}

// Format log message for display
const formatLogMessage = (log) => {
  // Extract meaningful info from log message
  let message = log.message
  
  // Clean up common log prefixes
  message = message.replace(/^\[[^\]]+\]\s+/, '')
  
  // Handle API specific messages
  if (log.data && log.data.url) {
    const url = log.data.url
    
    // Extract collection and operation from URL
    if (url.includes('/api/collections/')) {
      const urlParts = url.split('/')
      const collectionIndex = urlParts.findIndex(part => part === 'collections')
      
      if (collectionIndex >= 0 && collectionIndex + 1 < urlParts.length) {
        const collection = urlParts[collectionIndex + 1]
        const isRecord = urlParts.includes('records')
        
        // Format based on HTTP method
        if (log.data.method === 'POST' && isRecord) {
          message = `New ${collection.slice(0, -1)} created`
        } else if (log.data.method === 'PATCH' && isRecord) {
          message = `${collection.slice(0, -1).charAt(0).toUpperCase() + collection.slice(0, -1).slice(1)} updated`
        } else if (log.data.method === 'DELETE' && isRecord) {
          message = `${collection.slice(0, -1).charAt(0).toUpperCase() + collection.slice(0, -1).slice(1)} deleted`
        }
      }
    }
    
    // Handle auth related messages
    if (url.includes('/auth-with-password')) {
      message = 'User logged in'
    }
  }
  
  return message
}

// Use mock activity data when logs aren't available
const useMockActivityData = () => {
  activity.value = [
    {
      type: 'login',
      title: 'Admin user logged in',
      timestamp: '10 minutes ago'
    },
    {
      type: 'create',
      title: 'New edge created',
      timestamp: '2 hours ago'
    },
    {
      type: 'update',
      title: 'Thing updated',
      timestamp: '4 hours ago'
    },
    {
      type: 'error',
      title: 'Failed login attempt',
      timestamp: 'Yesterday at 18:45'
    }
  ]
}

// Helper to format timestamp
const formatTimestamp = (isoDate) => {
  if (!isoDate) return ''
  
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 2) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  // Format date for older entries
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Open Grafana
const openGrafana = () => {
  window.open(import.meta.env.VITE_GRAFANA_URL || 'https://grafana.domain.com', '_blank')
}
</script>

<style scoped>
.dashboard {
  padding-bottom: 1.5rem;
}

/* Ensure bottom spacing on mobile */
@media (max-width: 640px) {
  .dashboard {
    padding-bottom: 2rem;
  }
  
  .grid-cols-dashboard {
    margin-bottom: 1.5rem;
  }
}
</style>
