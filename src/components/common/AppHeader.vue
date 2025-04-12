<!-- src/components/common/AppHeader.vue -->
<template>
  <header class="bg-white border-b border-gray-200 h-16 flex items-center dark:bg-gray-800 dark:border-gray-700">
    <div class="flex items-center justify-between px-4 py-3 w-full">
      <!-- Mobile menu button -->
      <button 
        @click="$emit('toggle-sidebar')"
        class="p-2 rounded-md text-gray-500 lg:hidden touch-target dark:text-gray-300"
        aria-label="Toggle navigation menu"
      >
        <i class="pi pi-bars"></i>
      </button>
      
      <!-- Logo & Title -->
      <div class="flex items-center">
        <router-link to="/" class="flex items-center space-x-2">
          <div class="text-primary-600 w-8 h-8 flex items-center justify-center rounded-md dark:text-primary-400">
            <!-- Custom SVG Logo - replaces the home icon -->
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="28" 
              height="28" 
              viewBox="0 0 256 256" 
              class="logo-image"
              aria-label="Company Logo"
            >
              <path 
                d="M 128,0 C 57.343,0 0,57.343 0,128 C 0,198.657 57.343,256 128,256 C 198.657,256 256,198.657 256,128 C 256,57.343 198.657,0 128,0 z M 128,28 C 181.423,28 224.757,71.334 224.757,124.757 C 224.757,139.486 221.04,153.32 214.356,165.42 C 198.756,148.231 178.567,138.124 162.876,124.331 C 155.723,124.214 128.543,124.043 113.254,124.043 C 113.254,147.334 113.254,172.064 113.254,190.513 C 100.456,179.347 94.543,156.243 94.543,156.243 C 83.432,147.065 31.243,124.757 31.243,124.757 C 31.243,71.334 74.577,28 128,28 z" 
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 class="text-xl font-semibold hidden sm:block whitespace-nowrap dark:text-white">Stone-Age.io</h1>
        </router-link>
      </div>
      
      <!-- User Menu -->
      <div class="flex items-center">
        <!-- Theme Toggle -->
        <ThemeToggle class="mr-2" />
        
        <!-- Notifications - hide on small mobile -->
        <Button
          icon="pi pi-bell"
          class="p-button-text p-button-rounded hidden sm:block"
          aria-label="Notifications"
          @click="notificationsVisible = !notificationsVisible"
          badge="0"
          badgeClass="p-badge-danger"
        />
        
        <!-- User Menu -->
        <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
        <div class="flex items-center ml-1 sm:ml-4">
          <Button
            @click="toggleUserMenu"
            class="p-button-text p-button-rounded flex items-center"
          >
            <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-0 sm:mr-2 font-semibold dark:bg-primary-900 dark:text-primary-300">
              {{ userInitials }}
            </div>
            <span class="hidden sm:inline-block dark:text-white">{{ userFullName }}</span>
            <i class="pi pi-angle-down ml-1 hidden sm:block dark:text-gray-300"></i>
          </Button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import ThemeToggle from './ThemeToggle.vue'

const router = useRouter()
const authStore = useAuthStore()
const userMenu = ref(null)
const notificationsVisible = ref(false)

// User info from the auth store
const userFullName = computed(() => authStore.userFullName)
const userInitials = computed(() => authStore.userInitials)

// Emit events
const props = defineProps({
  sidebarOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-sidebar'])

// User menu items - Updated with settings navigation
const userMenuItems = [
  { 
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => {
      router.push({ name: 'profile' })
    }
  },
  { 
    label: 'Settings',
    icon: 'pi pi-cog',
    command: () => {
      router.push({ name: 'settings' })
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

<style>
/* Custom styling for the logo */
.logo-image {
  fill: var(--primary-color, #3B82F6);
}

/* Hover effect for the logo */
.router-link-active .logo-image,
a:hover .logo-image {
  fill: var(--primary-700, #1D4ED8);
}

/* Dark mode styling fixes for PrimeVue Menu */
.dark .p-menu {
  @apply bg-gray-800 border-gray-700;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
}

.dark .p-menu .p-menuitem-link {
  @apply text-gray-300;
}

.dark .p-menu .p-menuitem-link:hover {
  @apply bg-gray-700;
}

.dark .p-menu .p-menuitem-link .p-menuitem-icon {
  @apply text-gray-400;
}

.dark .p-menu .p-menuitem-link:hover .p-menuitem-icon {
  @apply text-gray-300;
}

.dark .p-menu .p-menuitem-link .p-menuitem-text {
  @apply text-gray-300;
}

.dark .p-menu .p-submenu-header {
  @apply bg-gray-900 text-gray-400;
}

.dark .p-menu .p-separator {
  @apply border-gray-700;
}

/* Button styling in dark mode */
.dark .p-button.p-button-text {
  @apply text-gray-300;
}

.dark .p-button.p-button-text:hover {
  @apply bg-gray-700;
}

.dark .p-button.p-button-text .p-button-icon {
  @apply text-gray-400;
}

.dark .p-button.p-button-text:hover .p-button-icon {
  @apply text-gray-300;
}

/* Badge styling in dark mode */
.dark .p-badge {
  @apply bg-red-600 text-white;
}

.dark .p-badge-danger {
  @apply bg-red-600 text-white;
}

/* Shadow styling in dark mode */
.dark .shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.25);
}

/* User menu styling in dark mode */
.dark .p-button.p-button-rounded .pi-angle-down {
  @apply text-gray-400;
}
</style>
