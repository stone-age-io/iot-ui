<!-- src/components/common/MobileNavBar.vue -->
<template>
  <nav 
    class="lg:hidden fixed bottom-0 left-0 right-0 border-t shadow-lg z-30 theme-transition"
    :class="navClasses"
    v-if="showMobileNav"
  >
    <div class="flex justify-around items-center py-2">
      <router-link 
        v-for="item in navItems" 
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center p-2 touch-target"
        :class="isActive(item.to) ? activeItemClass : inactiveItemClass"
      >
        <i :class="[item.icon, 'text-lg']"></i>
        <span class="text-xs mt-1">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '../../composables/useTheme'

const route = useRoute()
const { isDarkMode } = useTheme()

// Only show mobile nav when not on dashboard (to avoid redundancy)
const showMobileNav = computed(() => {
  return route.path !== '/' && route.name !== 'dashboard'
})

// Theme-specific classes
const navClasses = computed(() => ({
  'bg-white border-gray-200': !isDarkMode.value,
  'dark:bg-gray-800 dark:border-gray-700': isDarkMode.value
}))

const activeItemClass = computed(() => ({
  'text-primary-600': !isDarkMode.value,
  'dark:text-primary-400': isDarkMode.value
}))

const inactiveItemClass = computed(() => ({
  'text-gray-500': !isDarkMode.value,
  'dark:text-gray-400': isDarkMode.value
}))

// Primary navigation items for mobile
const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  { label: 'Map', icon: 'pi pi-map', to: '/map' },
  { label: 'Edges', icon: 'pi pi-server', to: '/edges' },
  { label: 'Locations', icon: 'pi pi-map-marker', to: '/locations' },
  { label: 'Things', icon: 'pi pi-wifi', to: '/things' }
]

// Check if route is active
const isActive = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style scoped>
.theme-transition {
  transition-property: background-color, border-color, color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Ensure good touch target size */
.touch-target {
  min-height: 44px;
  min-width: 56px;
}

/* Add subtle animation for active state */
.text-primary-600,
.dark\:text-primary-400 {
  position: relative;
}

.text-primary-600::after,
.dark\:text-primary-400::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--primary-color, #3B82F6);
}

/* Add subtle animation when tapping */
.touch-target:active {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}

.touch-target:not(:active) {
  transform: scale(1);
  transition: transform 0.2s ease;
}
</style>
