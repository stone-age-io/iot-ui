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
const mqttUsersCount = ref(0)
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
    label: 'MQTT Users',
    value: mqttUsersCount.value,
    icon: 'pi pi-users',
    color: 'orange',
    linkTo: '/mqtt-users'
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
    
    // Try to fetch stats from API
    try {
      const response = await apiService.get('/api/stats')
      if (response.data) {
        edgesCount.value = response.data.edges || 0
        locationsCount.value = response.data.locations || 0
        thingsCount.value = response.data.things || 0
        mqttUsersCount.value = response.data.users || 0
        return
      }
    } catch (err) {
      console.warn('Could not fetch stats from API, fetching individual counts', err)
    }
    
    // If the stats API isn't available, fetch individual counts
    const [edgesResponse, locationsResponse, thingsResponse] = await Promise.all([
      apiService.get('/pb/api/collections/edges/records?perPage=1'),
      apiService.get('/pb/api/collections/locations/records?perPage=1'),
      apiService.get('/pb/api/collections/things/records?perPage=1')
    ])
    
    edgesCount.value = edgesResponse.data.totalItems || 0
    locationsCount.value = locationsResponse.data.totalItems || 0
    thingsCount.value = thingsResponse.data.totalItems || 0
    mqttUsersCount.value = 0 // Default if not available
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Set fallback values if API calls fail
    edgesCount.value = 0
    locationsCount.value = 0
    thingsCount.value = 0
    mqttUsersCount.value = 0
  } finally {
    loading.value = false
  }
}

// Fetch recent activity data
const fetchActivityData = async () => {
  try {
    // Try to fetch recent activity from the audit log API
    try {
      const response = await apiService.get('/pb/api/collections/audit_logs/records?sort=-created&perPage=5&expand=user')
      if (response.data && response.data.items) {
        // Transform audit logs to activity items
        activity.value = response.data.items.map(log => ({
          type: mapAuditTypeToActivityType(log.action),
          title: formatAuditTitle(log),
          timestamp: formatTimestamp(log.created)
        }))
        return
      }
    } catch (err) {
      console.warn('Could not fetch audit logs, using mock data', err)
    }
    
    // If the audit log API isn't available, use mock data
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
    console.error('Error fetching activity data:', error)
    activity.value = [] // Empty array if failed
  }
}

// Helper to map audit log action to activity type
const mapAuditTypeToActivityType = (action) => {
  switch (action) {
    case 'create': return 'create'
    case 'update': return 'update'
    case 'delete': return 'delete'
    case 'login': return 'login'
    case 'logout': return 'login'
    case 'error': return 'error'
    default: return 'info'
  }
}

// Helper to format audit log title
const formatAuditTitle = (log) => {
  const userName = log.expand?.user?.name || 'A user'
  
  switch (log.action) {
    case 'create':
      return `${userName} created ${log.collection} "${log.record_id}"`
    case 'update':
      return `${userName} updated ${log.collection} "${log.record_id}"`
    case 'delete':
      return `${userName} deleted ${log.collection} "${log.record_id}"`
    case 'login':
      return `${userName} logged in`
    case 'logout':
      return `${userName} logged out`
    default:
      return `${log.action} on ${log.collection} "${log.record_id}"`
  }
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
