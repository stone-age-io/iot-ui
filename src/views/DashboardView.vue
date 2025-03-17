<!-- src/views/DashboardView.vue -->
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
  try {
    loading.value = true
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Set mock data
    edgesCount.value = 12
    locationsCount.value = 48
    thingsCount.value = 156
    mqttUsersCount.value = 23
    
    // Mock activity data
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
