<!-- src/components/dashboard/DashboardCard.vue -->
<template>
  <div class="dashboard-card bg-theme-surface border border-theme" :class="[noPadding ? 'p-0' : '', className]">
    <div v-if="title && !noPadding" class="dashboard-card-header">
      <h2 class="dashboard-card-title text-theme-primary">{{ title }}</h2>
      <slot name="header-actions"></slot>
    </div>
    <div :class="{'dashboard-card-body': !noPadding, 'p-5': noPadding}">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { useTheme } from '../../composables/useTheme';

// Use theme composable even if we don't directly access it in the setup function
// This signals that the component is theme-aware
useTheme();

defineProps({
  title: {
    type: String,
    default: ''
  },
  noPadding: {
    type: Boolean,
    default: false
  },
  className: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.dashboard-card {
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 1.25rem;
  overflow: hidden;
  transition: background-color var(--theme-transition-duration, 0.2s) var(--theme-transition-timing, ease),
              border-color var(--theme-transition-duration, 0.2s) var(--theme-transition-timing, ease);
}

.dashboard-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.25rem 0 1.25rem;
}

.dashboard-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  transition: color var(--theme-transition-duration, 0.2s) var(--theme-transition-timing, ease);
}

.dashboard-card-body {
  padding: 1.25rem;
}

@media (max-width: 640px) {
  .dashboard-card-header {
    padding: 1rem 1rem 0 1rem;
  }
  
  .dashboard-card-title {
    font-size: 1rem;
  }
  
  .dashboard-card-body {
    padding: 1rem;
  }
}
</style>
