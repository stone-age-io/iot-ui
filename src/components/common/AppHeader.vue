<!-- src/components/common/AppHeader.vue -->
<template>
  <header 
    class="app-header h-16 border-b theme-transition shadow-sm fixed top-0 left-0 right-0 z-40"
    :class="headerClasses"
  >
    <div class="grid grid-cols-3 items-center h-full px-4 w-full">
      <!-- Left section - Mobile menu button - explicitly hidden on lg screens -->
      <div class="flex items-center justify-start">
        <button 
          @click="$emit('toggle-sidebar')"
          class="p-2 rounded-md text-theme-secondary touch-target dark:text-gray-300 focus-ring mobile-menu-button hidden"
          :class="{'block lg:!hidden': true}"
          aria-label="Toggle navigation menu"
        >
          <i class="pi pi-bars"></i>
        </button>
      </div>
      
      <!-- Center section - Logo & Title -->
      <div class="flex items-center justify-center">
        <router-link to="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 flex items-center justify-center rounded-md" :class="logoClasses">
            <!-- Custom SVG Logo -->
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
          <h1 class="text-xl font-semibold whitespace-nowrap text-theme-primary dark:text-white">Stone-Age.io</h1>
        </router-link>
      </div>
      
      <!-- Right section - User Menu -->
      <div class="flex items-center justify-end">
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
        
        <!-- User Menu using OverlayPanel instead of Menu -->
        <OverlayPanel ref="userPanel" :showCloseIcon="false" class="p-0">
          <div class="user-menu-panel">
            <div 
              v-for="(item, index) in userMenuItems" 
              :key="index"
              class="user-menu-item"
            >
              <template v-if="item.separator">
                <div class="user-menu-separator"></div>
              </template>
              <template v-else>
                <a 
                  href="#" 
                  class="user-menu-link"
                  @click.prevent="item.command"
                >
                  <i :class="[item.icon, 'user-menu-icon']"></i>
                  <span>{{ item.label }}</span>
                </a>
              </template>
            </div>
          </div>
        </OverlayPanel>
        
        <!-- User Menu Trigger -->
        <div class="user-menu-trigger">
          <Button
            @click="toggleUserMenu"
            class="p-button-text p-button-rounded flex items-center user-button"
          >
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center mr-0 sm:mr-2 font-semibold"
              :class="userInitialsClasses"
            >
              {{ userInitials }}
            </div>
            <span class="hidden sm:inline-block text-theme-primary dark:text-white user-name">{{ userFullName }}</span>
            <i class="pi pi-angle-down ml-1 hidden sm:block dark:text-gray-300"></i>
          </Button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../composables/useTheme'
import Button from 'primevue/button'
import OverlayPanel from 'primevue/overlaypanel'
import ThemeToggle from './ThemeToggle.vue'

const router = useRouter()
const authStore = useAuthStore()
const userPanel = ref(null)
const notificationsVisible = ref(false)

// Use our theme composable
const { isDarkMode } = useTheme()

// User info from the auth store
const userFullName = computed(() => authStore.userFullName)
const userInitials = computed(() => authStore.userInitials)

// Theme-based classes
const headerClasses = computed(() => ({
  'bg-white border-gray-200': !isDarkMode.value,
  'dark:bg-gray-800 dark:border-gray-700': isDarkMode.value
}))

const logoClasses = computed(() => ({
  'text-primary-600': !isDarkMode.value,
  'dark:text-primary-400': isDarkMode.value
}))

const userInitialsClasses = computed(() => ({
  'bg-primary-100 text-primary-700': !isDarkMode.value,
  'dark:bg-primary-900 dark:text-primary-300': isDarkMode.value
}))

// Emit events
defineProps({
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
      userPanel.value.hide();
      router.push({ name: 'profile' });
    }
  },
  { 
    label: 'Settings',
    icon: 'pi pi-cog',
    command: () => {
      userPanel.value.hide();
      router.push({ name: 'settings' });
    }
  },
  { 
    separator: true 
  },
  { 
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => {
      userPanel.value.hide();
      authStore.logout();
    }
  }
]

// Toggle user menu with OverlayPanel
const toggleUserMenu = (event) => {
  userPanel.value.toggle(event);
}

// Ensure mobile menu button visibility is correct by manually adding classes
onMounted(() => {
  const checkViewport = () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-button');
    if (mobileMenuBtn) {
      // Force correct visibility based on viewport size
      if (window.innerWidth >= 1024) {
        mobileMenuBtn.classList.add('!hidden');
      } else {
        mobileMenuBtn.classList.remove('!hidden');
        mobileMenuBtn.classList.add('block');
      }
    }
  };

  // Check immediately and on resize
  checkViewport();
  window.addEventListener('resize', checkViewport);

  // Cleanup
  return () => window.removeEventListener('resize', checkViewport);
});
</script>

<style scoped>
/* App header consistent styling */
.app-header {
  background-color: rgb(var(--color-surface));
  border-color: rgb(var(--color-border));
}

/* Custom styling for the logo */
.logo-image {
  fill: var(--primary-color, #3B82F6);
  transition: fill 0.2s ease;
}

/* Hover effect for the logo */
.router-link-active .logo-image,
a:hover .logo-image {
  fill: var(--primary-color-hover, #1D4ED8);
}

/* User menu styling */
.user-menu-panel {
  min-width: 200px;
  padding: 0.5rem 0;
}

.user-menu-item {
  width: 100%;
}

.user-menu-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: rgb(var(--color-text));
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.user-menu-link:hover {
  background-color: var(--surface-hover);
}

.user-menu-icon {
  margin-right: 0.75rem;
  color: rgb(var(--color-text-secondary));
}

.user-menu-separator {
  height: 1px;
  margin: 0.25rem 0;
  background-color: rgb(var(--color-border));
}

/* Force important for mobile menu visibility */
.mobile-menu-button {
  display: none !important; /* Default hidden */
}

@media (max-width: 1023px) {
  .mobile-menu-button {
    display: block !important; /* Show on mobile */
  }
}

/* Focus styles for better accessibility */
button:focus-visible,
a:focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
  @apply dark:ring-primary-400 dark:ring-offset-gray-800;
}

/* Prevent user button from shifting layout */
.user-button {
  position: relative !important;
  z-index: 1 !important;
}

.user-menu-trigger {
  position: relative !important;
}
</style>
