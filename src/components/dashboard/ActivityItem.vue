<!-- src/components/dashboard/ActivityItem.vue -->
<template>
  <div class="activity-item border-theme">
    <div class="activity-icon" :class="getIconColorClass">
      <i :class="iconClass"></i>
    </div>
    <div class="activity-content">
      <div class="activity-title text-theme-primary">{{ title }}</div>
      <div class="activity-time text-theme-secondary">{{ time }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTheme } from '../../composables/useTheme';

// Use theme composable for reactive theme values
const { themeValue } = useTheme();

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['login', 'create', 'update', 'delete', 'error', 'info'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  }
});

// Determine icon based on activity type
const iconClass = computed(() => {
  switch (props.type) {
    case 'login': return 'pi pi-sign-in';
    case 'create': return 'pi pi-plus';
    case 'update': return 'pi pi-pencil';
    case 'delete': return 'pi pi-trash';
    case 'error': return 'pi pi-exclamation-triangle';
    default: return 'pi pi-info-circle';
  }
});

// Get the appropriate color class based on activity type
const getIconColorClass = computed(() => {
  const colorMap = {
    login: themeValue.value.class('bg-blue-100 text-blue-700', 'bg-blue-900/30 text-blue-400'),
    create: themeValue.value.class('bg-green-100 text-green-700', 'bg-green-900/30 text-green-400'),
    update: themeValue.value.class('bg-purple-100 text-purple-700', 'bg-purple-900/30 text-purple-400'),
    delete: themeValue.value.class('bg-red-100 text-red-700', 'bg-red-900/30 text-red-400'),
    error: themeValue.value.class('bg-amber-100 text-amber-700', 'bg-amber-900/30 text-amber-400'),
    info: themeValue.value.class('bg-gray-100 text-gray-700', 'bg-gray-700 text-gray-400')
  };

  return colorMap[props.type] || colorMap.info;
});
</script>

<style scoped>
.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom-width: 1px;
  border-bottom-style: solid;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25;
}

.activity-time {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
