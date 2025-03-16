<template>
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="flex items-center justify-between px-6 py-3">
      <!-- Logo & Title -->
      <div class="flex items-center space-x-3">
        <router-link to="/" class="flex items-center space-x-2">
          <div class="text-primary-600 w-8 h-8 flex items-center justify-center rounded-md bg-primary-50">
            <i class="pi pi-home text-xl"></i>
          </div>
          <h1 class="text-xl font-semibold">IoT Platform</h1>
        </router-link>
      </div>
      
      <!-- User Menu -->
      <div class="flex items-center">
        <!-- Notifications (placeholder) -->
        <Button
          icon="pi pi-bell"
          class="p-button-text p-button-rounded"
          aria-label="Notifications"
          @click="notificationsVisible = !notificationsVisible"
        />
        
        <!-- User Menu -->
        <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
        <div class="flex items-center ml-4">
          <Button
            @click="toggleUserMenu"
            class="p-button-text p-button-rounded flex items-center"
          >
            <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-2 font-semibold">
              {{ userInitials }}
            </div>
            <span class="hidden sm:inline-block">{{ userFullName }}</span>
            <i class="pi pi-angle-down ml-2"></i>
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
