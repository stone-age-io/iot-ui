<template>
  <aside
    class="bg-white border-r border-gray-200 w-64 transition-all duration-300 ease-in-out"
    :class="{ 'w-16': collapsed, 'w-64': !collapsed }"
  >
    <div class="p-4 flex justify-end">
      <Button
        @click="toggleCollapse"
        icon="pi pi-chevron-left"
        :class="{ 'rotate-180': collapsed }"
        class="p-button-text p-button-rounded transition-transform"
        aria-label="Toggle Sidebar"
      />
    </div>
    
    <div class="px-4">
      <div v-for="(section, index) in menuSections" :key="index" class="mb-6">
        <h3
          v-if="!collapsed"
          class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-3"
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
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              <i :class="[item.icon, 'mr-3 text-lg', isActive ? 'text-primary-600' : 'text-gray-500']"></i>
              <span :class="{ 'opacity-0 w-0 hidden': collapsed }">{{ item.label }}</span>
            </a>
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- Bottom section with Grafana link -->
    <div class="absolute bottom-0 w-full p-4 border-t border-gray-200">
      <a 
        :href="grafanaUrl" 
        target="_blank"
        class="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <i class="pi pi-chart-line mr-3 text-lg text-gray-500"></i>
        <span :class="{ 'opacity-0 w-0 hidden': collapsed }">Grafana Dashboards</span>
      </a>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'

// External links
const grafanaUrl = computed(() => import.meta.env.VITE_GRAFANA_URL || 'https://grafana.domain.com')

// Sidebar state
const collapsed = ref(false)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
  // You might want to persist this setting in localStorage
}

// Menu structure
const menuSections = [
  {
    title: 'Core',
    items: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        to: '/'
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
    title: 'MQTT',
    items: [
      {
        label: 'Users',
        icon: 'pi pi-users',
        to: '/mqtt-users'
      },
      {
        label: 'Roles',
        icon: 'pi pi-key',
        to: '/mqtt-roles'
      }
    ]
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        to: '/settings'
      }
    ]
  }
]
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}
</style>
