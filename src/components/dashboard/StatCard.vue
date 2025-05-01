<!-- src/components/dashboard/StatCard.vue -->
<template>
  <div class="stat-card bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark theme-transition" :class="[hoverEffect ? 'hover:shadow-md hover:-translate-y-1' : '']">
    <div class="stat-card-icon" :class="iconClass">
      <i :class="[icon, textClass]"></i>
    </div>
    <div class="stat-card-content">
      <div class="stat-card-label text-content-secondary dark:text-content-secondary-dark">{{ label }}</div>
      <div class="stat-card-value text-content-primary dark:text-content-primary-dark">{{ value }}</div>
    </div>
    <router-link :to="linkTo" class="stat-card-link" :class="textClass">
      <span>{{ linkText }}</span>
      <i class="pi pi-arrow-right"></i>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTheme } from '../../composables/useTheme';

// Use theme composable for reactive theme
const { isDarkMode } = useTheme();

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'purple', 'orange', 'red', 'gray'].includes(value)
  },
  linkTo: {
    type: [String, Object],
    required: true
  },
  linkText: {
    type: String,
    default: 'View all'
  },
  hoverEffect: {
    type: Boolean,
    default: true
  }
});

// Computed classes for theming
const iconClass = computed(() => {
  // Icon background classes with dark mode variants
  const colorClassMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    gray: 'bg-gray-50 dark:bg-gray-700'
  };
  
  return colorClassMap[props.color] || colorClassMap.gray;
});

const textClass = computed(() => {
  // Text color classes with dark mode variants
  const colorClassMap = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-600 dark:text-gray-400'
  };
  
  return colorClassMap[props.color] || colorClassMap.gray;
});
</script>

<style scoped>
.stat-card {
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.875rem;
  flex-shrink: 0;
}

.stat-card-icon i {
  font-size: 1.125rem;
}

.stat-card-content {
  flex: 1;
  min-width: 0;
}

.stat-card-label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25;
}

.stat-card-value {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.25;
}

.stat-card-link {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 500;
  transition: opacity 0.15s ease;
}

.stat-card-link i {
  font-size: 0.675rem;
  margin-left: 0.25rem;
}

.stat-card-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
</style>
