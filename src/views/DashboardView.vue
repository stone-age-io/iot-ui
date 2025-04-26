<template>
  <div class="dashboard">
    <PageHeader title="Dashboard"/>
    
    <!-- Status Cards Grid -->
    <div class="stat-cards-grid mb-6">
      <StatCard
        v-for="(card, index) in statCards"
        :key="index"
        :label="card.label"
        :value="card.value || 0"
        :icon="card.icon"
        :color="card.color"
        :link-to="card.linkTo"
      />
    </div>
    
    <!-- NATS Message Feed -->
    <DashboardCard>
      <NatsMessageFeed />
    </DashboardCard>
    
    <!-- Recent Activity from Audit Logs -->
    <DashboardCard title="Recent Activity">
      <div v-if="loading" class="empty-state text-theme-secondary">
        <ProgressSpinner style="width: 24px; height: 24px" />
      </div>
      
      <div v-else-if="!activity || activity.length === 0" class="empty-state text-theme-secondary">
        No recent activity found.
      </div>
      
      <div v-else class="activity-feed">
        <ActivityItem
          v-for="item in displayedActivities" 
          :key="item.id"
          :type="item.type"
          :title="item.title"
          :time="item.timestamp"
          :details="item.details"
          :user="item.user"
          :showDetails="expandedDetails"
        />
      </div>
      
      <!-- Activity Control Buttons -->
      <div v-if="activity && activity.length > 0" class="mt-3 flex justify-between items-center">
        <Button
          :label="expandedDetails ? 'Hide Details' : 'Show Details'"
          :icon="expandedDetails ? 'pi pi-eye-slash' : 'pi pi-eye'"
          class="p-button-text p-button-sm"
          @click="toggleExpandDetails"
        />
        
        <div class="flex">
          <Button
            v-if="activity.length > displayedItems"
            label="Show More"
            icon="pi pi-chevron-down"
            class="p-button-text p-button-sm mr-2"
            @click="showMoreActivity"
          />
          
          <Button
            v-if="activity.length > 5"
            label="View All Activity"
            icon="pi pi-list"
            class="p-button-text p-button-sm"
            @click="navigateToAuditLogs"
          />
        </div>
      </div>
    </DashboardCard>
    
    <!-- Integrations -->
    <DashboardCard>
      <div class="flex items-center">
        <div class="icon-md icon-container icon-blue mr-4">
          <i class="pi pi-chart-line"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-base font-medium text-theme-primary">Analytics & Dashboards</div>
          <div class="text-sm text-theme-secondary hidden sm:block mt-1">View metrics in Grafana</div>
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboard } from '../composables/useDashboard'
import { useTheme } from '../composables/useTheme'
import PageHeader from '../components/common/PageHeader.vue'
import StatCard from '../components/dashboard/StatCard.vue'
import ActivityItem from '../components/dashboard/ActivityItem.vue'
import DashboardCard from '../components/dashboard/DashboardCard.vue'
import NatsMessageFeed from '../components/dashboard/NatsMessageFeed.vue'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'

// Use Vue Router
const router = useRouter()

// Use theme composable
const { themeValue } = useTheme()

// Use the dashboard composable
const { 
  edgesCount,
  locationsCount, 
  thingsCount,
  clientsCount,
  activity,
  loading,
  fetchDashboardData,
  openGrafana
} = useDashboard()

// State for activity display
const displayedItems = ref(5)
const expandedDetails = ref(false)

// Computed property for displayed activities with proper array checking
const displayedActivities = computed(() => {
  if (!activity.value || !Array.isArray(activity.value)) {
    return []
  }
  return activity.value.slice(0, displayedItems.value)
})

// Toggle expanded details view
const toggleExpandDetails = () => {
  expandedDetails.value = !expandedDetails.value
}

// Show more activity items
const showMoreActivity = () => {
  // Check if activity is valid first
  if (!activity.value || !Array.isArray(activity.value)) {
    return
  }
  
  // Increase shown items by 5, up to the total count
  displayedItems.value = Math.min(displayedItems.value + 5, activity.value.length)
}

// Method to navigate to the audit logs page (can be implemented later)
const navigateToAuditLogs = () => {
  // This will be implemented when you create an audit logs page
  // For now, just show a notification
  alert('Audit Logs page coming soon!')
}

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

// Fetch dashboard data on mount
onMounted(async () => {
  await fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding-bottom: 1.5rem;
}

.stat-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .stat-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .stat-cards-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
  }
}

.empty-state {
  @apply flex justify-center items-center py-8 text-sm;
  transition: color var(--theme-transition-duration, 0.2s) var(--theme-transition-timing, ease);
}

.activity-feed {
  max-height: 350px;
  overflow-y: auto;
}

@media (max-width: 640px) {
  .dashboard {
    padding-bottom: 2rem;
  }
  
  .stat-cards-grid {
    margin-bottom: 1rem;
  }
}
</style>
