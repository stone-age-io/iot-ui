<template>
  <div class="page-header-wrapper flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0 theme-transition">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold text-theme-primary dark:text-gray-200">{{ title }}</h1>
      <p v-if="subtitle" class="text-theme-secondary dark:text-gray-400 mt-1">{{ subtitle }}</p>
    </div>
    
    <div class="mt-2 sm:mt-0">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
import { useTheme } from '../../composables/useTheme';

// Access theme information
const { isDarkMode } = useTheme();

defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.page-header-wrapper h1 {
  color: rgb(var(--color-text));
}

.page-header-wrapper p {
  color: rgb(var(--color-text-secondary));
}

/* Add smooth transitions for theme changes */
.theme-transition,
.theme-transition * {
  transition: color 0.2s ease;
}
</style>
