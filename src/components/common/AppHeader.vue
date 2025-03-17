<!-- src/components/common/AppHeader.vue -->
<template>
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="flex items-center justify-between px-4 py-3">
      <!-- Mobile menu button -->
      <button 
        @click="$emit('toggle-sidebar')"
        class="p-2 rounded-md text-gray-500 lg:hidden touch-target"
      >
        <i class="pi pi-bars"></i>
      </button>
      
      <!-- Logo & Title -->
      <div class="flex items-center">
        <router-link to="/" class="flex items-center space-x-2">
          <div class="text-primary-600 w-8 h-8 flex items-center justify-center rounded-md bg-primary-50">
            <i class="pi pi-home text-xl"></i>
          </div>
          <h1 class="text-xl font-semibold hidden sm:block">IoT Platform</h1>
        </router-link>
      </div>
      
      <!-- User Menu -->
      <div class="flex items-center">
        <!-- Notifications - hide on small mobile -->
        <Button
          icon="pi pi-bell"
          class="p-button-text p-button-rounded hidden sm:block"
          aria-label="Notifications"
          @click="notificationsVisible = !notificationsVisible"
        />
        
        <!-- User Menu -->
        <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
        <div class="flex items-center ml-1 sm:ml-4">
          <Button
            @click="toggleUserMenu"
            class="p-button-text p-button-rounded flex items-center"
          >
            <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-0 sm:mr-2 font-semibold">
              {{ userInitials }}
            </div>
            <span class="hidden sm:inline-block">{{ userFullName }}</span>
            <i class="pi pi-angle-down ml-1 hidden sm:block"></i>
          </Button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import Button from 'primevue/button'
import Menu from 'primevue/menu'

const authStore = useAuthStore()
const userMenu = ref(null)
const notificationsVisible = ref(false)

// User info from the auth store
const userFullName = computed(() => authStore.userFullName)
const userInitials = computed(() => authStore.userInitials)

// Emit events
const emit = defineProps({
  sidebarOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-sidebar'])

// User menu items
const userMenuItems = [
  { 
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => {
      // Navigate to profile page
    }
  },
  { 
    label: 'Settings',
    icon: 'pi pi-cog',
    command: () => {
      // Navigate to settings page
    }
  },
  { 
    separator: true 
  },
  { 
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => {
      authStore.logout()
    }
  }
]

// Toggle user menu
const toggleUserMenu = (event) => {
  userMenu.value.toggle(event)
}
</script>
