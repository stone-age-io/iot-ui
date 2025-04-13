<!-- src/components/common/Badge.vue -->
<template>
  <span
    :class="[
      'badge inline-flex items-center rounded-full font-medium',
      sizeClasses,
      variantClasses
    ]"
  >
    <slot></slot>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { useThemeStore } from '../../stores/theme';

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => [
      'default', 'primary', 'success', 'warning',
      'danger', 'info', 'purple', 'amber', 'cyan', 
      'indigo', 'teal', 'orange', 'red', 'gray', 'blue'
    ].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
});

// Access the theme store
const themeStore = useThemeStore();

// Determine if we're in dark mode
const isDarkMode = computed(() => {
  return themeStore.theme === 'dark' || 
    (themeStore.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
});

// Map variant to Tailwind classes with dark mode support
const variantClasses = computed(() => {
  // Base variant map
  const variantMap = {
    default: {
      light: 'bg-gray-100 text-gray-800',
      dark: 'bg-gray-700 text-gray-300'
    },
    primary: {
      light: 'bg-blue-100 text-blue-800',
      dark: 'bg-blue-900/30 text-blue-300'
    },
    success: {
      light: 'bg-green-100 text-green-800',
      dark: 'bg-green-900/30 text-green-300'
    },
    warning: {
      light: 'bg-amber-100 text-amber-800',
      dark: 'bg-amber-900/30 text-amber-300'
    },
    danger: {
      light: 'bg-red-100 text-red-800',
      dark: 'bg-red-900/30 text-red-300'
    },
    info: {
      light: 'bg-blue-100 text-blue-800',
      dark: 'bg-blue-900/30 text-blue-300'
    },
    purple: {
      light: 'bg-purple-100 text-purple-800',
      dark: 'bg-purple-900/30 text-purple-300'
    },
    amber: {
      light: 'bg-amber-100 text-amber-800',
      dark: 'bg-amber-900/30 text-amber-300'
    },
    cyan: {
      light: 'bg-cyan-100 text-cyan-800',
      dark: 'bg-cyan-900/30 text-cyan-300'
    },
    indigo: {
      light: 'bg-indigo-100 text-indigo-800',
      dark: 'bg-indigo-900/30 text-indigo-300'
    },
    teal: {
      light: 'bg-teal-100 text-teal-800',
      dark: 'bg-teal-900/30 text-teal-300'
    },
    orange: {
      light: 'bg-orange-100 text-orange-800',
      dark: 'bg-orange-900/30 text-orange-300'
    },
    red: {
      light: 'bg-red-100 text-red-800',
      dark: 'bg-red-900/30 text-red-300'
    },
    gray: {
      light: 'bg-gray-100 text-gray-800',
      dark: 'bg-gray-700 text-gray-300'
    },
    blue: {
      light: 'bg-blue-100 text-blue-800',
      dark: 'bg-blue-900/30 text-blue-300'
    }
  };

  // Get the variant map (or default if not found)
  const variant = variantMap[props.variant] || variantMap.default;
  
  // Return classes based on current theme
  return isDarkMode.value ? variant.dark : variant.light;
});

// Map size to Tailwind classes
const sizeClasses = computed(() => {
  const sizeMap = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1'
  };

  return sizeMap[props.size] || sizeMap.md;
});
</script>

<style>
/* Badge transitions */
.badge {
  transition: background-color 0.2s ease, color 0.2s ease;
}
</style>
