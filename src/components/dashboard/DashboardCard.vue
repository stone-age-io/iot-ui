<!-- src/components/dashboard/DashboardCard.vue -->
<template>
  <div class="dashboard-card" :class="[noPadding ? 'p-0' : '', className]">
    <div v-if="title && !noPadding" class="dashboard-card-header">
      <h2 class="dashboard-card-title">{{ title }}</h2>
      <slot name="header-actions"></slot>
    </div>
    <div :class="{'dashboard-card-body': !noPadding, 'p-5': noPadding}">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
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
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 1.25rem;
  overflow: hidden;
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
  color: #111827;
  margin: 0;
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
