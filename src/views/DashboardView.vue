<template>
  <div class="dashboard">
    <h1 class="page-header text-theme-primary">Dashboard</h1>
    
    <!-- Status Cards Grid - Updated to single row on desktop -->
    <div class="stat-cards-grid mb-6">
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
    
    <!-- NATS Message Feed - NatsStatus now integrated inside this component -->
    <DashboardCard>
      <NatsMessageFeed />
    </DashboardCard>
    
    <!-- Recent Activity -->
    <DashboardCard title="Recent Activity">
      <div v-if="loading" class="empty-state text-theme-secondary">
        <ProgressSpinner style="width: 24px; height: 24px" />
      </div>
      
      <div v-else-if="activity.length === 0" class="empty-state text-theme-secondary">
        No recent activity found.
      </div>
      
      <div v-else class="activity-feed">
        <ActivityItem
          v-for="(item, index) in activity.slice(0, 5)" 
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
import { computed, onMounted } from 'vue'
import { useDashboard } from '../composables/useDashboard'
import { useTheme } from '../composables/useTheme'
import StatCard from '../components/dashboard/StatCard.vue'
import ActivityItem from '../components/dashboard/ActivityItem.vue'
import DashboardCard from '../components/dashboard/DashboardCard.vue'
import NatsMessageFeed from '../components/dashboard/NatsMessageFeed.vue'
// Removed NatsStatus import since it's now integrated
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'

// Use theme composable
useTheme();

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
} = useDashboard();

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
]);

// Fetch dashboard data on mount
onMounted(async () => {
  await fetchDashboardData();
});
</script>

<style scoped>
.dashboard {
  padding-bottom: 1.5rem;
}

.page-header {
  transition: color var(--theme-transition-duration, 0.2s) var(--theme-transition-timing, ease);
}

/* New stat cards grid layout - single row on desktop, stack on mobile */
.stat-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

/* Tablet breakpoint - 2 cards per row */
@media (min-width: 640px) {
  .stat-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* Desktop breakpoint - all cards in a single row */
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

/* Ensure bottom spacing on mobile */
@media (max-width: 640px) {
  .dashboard {
    padding-bottom: 2rem;
  }
  
  .stat-cards-grid {
    margin-bottom: 1rem;
  }
}
</style>
