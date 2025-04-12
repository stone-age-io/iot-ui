<!-- src/components/common/AppSidebar.vue -->
<template>
  <aside
    :class="[
      'transition-all duration-300 ease-in-out flex flex-col h-full',
      'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
      open ? 'w-64' : 'w-64 -translate-x-full lg:translate-x-0',
      collapsed && !isMobileView ? 'lg:w-16' : 'lg:w-64'
    ]"
    style="max-width: 100%;"
  >
    <!-- Mobile close button -->
    <div class="lg:hidden p-4 flex justify-end">
      <Button
        @click="$emit('close')"
        icon="pi pi-times"
        class="p-button-text p-button-rounded"
        aria-label="Close sidebar"
      />
    </div>

    <!-- Collapse toggle for desktop -->
    <div class="p-4 hidden lg:flex justify-end">
      <Button
        @click="$emit('toggle-collapse')"
        :icon="collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"
        class="p-button-text p-button-rounded transition-transform"
        aria-label="Toggle Sidebar"
      />
    </div>
    
    <!-- Main navigation sections: flex-1 makes it take available space and allows scrolling -->
    <div class="flex-1 overflow-y-auto">
      <!-- Sidebar content -->
      <div v-for="(section, index) in menuSections" :key="index" class="mb-6">
        <h3
          v-if="(!collapsed || isMobileView) && section.title"
          class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-3 dark:text-gray-400"
        >
          {{ section.title }}
        </h3>
        
        <div class="space-y-1">
          <router-link
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            custom
            v-slot="{ href, navigate, isActive }"
          >
            <a
              :href="href"
              @click="navigate"
              class="flex items-center px-3 py-2 rounded-md transition-colors"
              :class="[
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              ]"
            >
              <i :class="[item.icon, 'text-lg', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400']"></i>
              <span 
                v-if="!collapsed || isMobileView" 
                class="ml-3 transition-opacity"
              >
                {{ item.label }}
              </span>
            </a>
          </router-link>
        </div>
      </div>
    </div>
  
    <!-- Bottom section with Grafana link - now properly aligned at bottom -->
    <div class="mt-auto border-t border-gray-200 dark:border-gray-700">
      <a 
        :href="grafanaUrl" 
        target="_blank"
        class="flex items-center px-3 py-4 text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <i class="pi pi-chart-line text-lg text-gray-500 dark:text-gray-400"></i>
        <span v-if="!collapsed || isMobileView" class="ml-3">Grafana</span>
      </a>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'toggle-collapse'])

// Responsive state
const windowWidth = ref(window.innerWidth)
const isMobileView = computed(() => windowWidth.value < 1024)

// Update window width on resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// Add resize event listener
onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize() // Initial check
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// External links
const grafanaUrl = computed(() => import.meta.env.VITE_GRAFANA_URL || 'https://grafana.domain.com')

// Menu structure - Updated with Map menu item
const menuSections = [
  {
    title: 'Core',
    items: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        to: '/'
      },
      {
        label: 'Map',
        icon: 'pi pi-map',
        to: '/map'
      }
    ]
  },
  {
    title: 'Entities',
    items: [
      {
        label: 'Edges',
        icon: 'pi pi-server',
        to: '/edges'
      },
      {
        label: 'Locations',
        icon: 'pi pi-map-marker',
        to: '/locations'
      },
      {
        label: 'Things',
        icon: 'pi pi-wifi',
        to: '/things'
      }
    ]
  },
  {
    title: 'Messaging',
    items: [
      {
        label: 'Clients',
        icon: 'pi pi-users',
        to: '/messaging/clients'
      },
      {
        label: 'Topic Permissions',
        icon: 'pi pi-key',
        to: '/messaging/permissions'
      }
    ]
  },
  {
    title: 'Type Management',
    items: [
      {
        label: 'Edge Types',
        icon: 'pi pi-tag',
        to: '/types/edge-types'
      },
      {
        label: 'Edge Regions',
        icon: 'pi pi-globe',
        to: '/types/edge-regions'
      },
      {
        label: 'Location Types',
        icon: 'pi pi-list',
        to: '/types/location-types'
      },
      {
        label: 'Thing Types',
        icon: 'pi pi-sitemap',
        to: '/types/thing-types'
      }
    ]
  }
]
</script>

<style>
/* Custom scrollbar styling for better appearance */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.dark .overflow-y-auto {
  scrollbar-color: #4b5563 #1f2937;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #1f2937;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #4b5563;
}

/* Active link highlight animation */
a.bg-primary-50,
a.dark\:bg-primary-900\/20 {
  position: relative;
  overflow: hidden;
}

a.bg-primary-50::after,
a.dark\:bg-primary-900\/20::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: var(--primary-color, #3B82F6);
}

/* Dark mode button styling */
.dark .p-button.p-button-text {
  color: rgb(209, 213, 219); /* text-gray-300 */
}

.dark .p-button.p-button-text:hover {
  background-color: rgba(55, 65, 81, 0.5); /* bg-gray-700 with opacity */
}

.dark .p-button.p-button-text:focus {
  box-shadow: 0 0 0 2px rgb(31, 41, 55), 0 0 0 4px rgb(59, 130, 246);
}

/* Transition improvements */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Mobile optimizations */
@media (max-width: 1023px) {
  .lg\:hidden {
    display: flex !important;
  }
}
</style>
