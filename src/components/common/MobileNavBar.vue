<!-- src/components/common/MobileNavBar.vue - Enhanced with dark mode support -->
<template>
  <nav 
    class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30 dark:bg-gray-800 dark:border-gray-700"
    v-if="showMobileNav"
  >
    <div class="flex justify-around items-center py-2">
      <router-link 
        v-for="item in navItems" 
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center p-2 touch-target"
        :class="{ 
          'text-primary-600 dark:text-primary-400': isActive(item.to), 
          'text-gray-500 dark:text-gray-400': !isActive(item.to) 
        }"
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

const route = useRoute()

// Only show mobile nav when not on dashboard (to avoid redundancy)
const showMobileNav = computed(() => {
  return route.path !== '/' && route.name !== 'dashboard';
})

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
</style>
