<!-- src/layouts/DefaultLayout.vue -->
<template>
  <div class="min-h-screen flex flex-col dark:bg-gray-900">
    <!-- Fixed Header -->
    <AppHeader 
      @toggle-sidebar="sidebarOpen = !sidebarOpen" 
      :sidebar-open="sidebarOpen"
      class="fixed top-0 left-0 right-0 z-40 shadow-sm"
    />
    
    <!-- Content area with offset for fixed header -->
    <div class="pt-16 flex flex-1">
      <!-- Mobile Overlay -->
      <div 
        v-if="sidebarOpen" 
        class="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
        @click="closeSidebar"
      ></div>
      
      <!-- Fixed Sidebar -->
      <div 
        :class="[
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)]',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0', 
          sidebarCollapsed && !isMobileView ? 'w-16' : 'w-64'
        ]"
      >
        <AppSidebar 
          :open="sidebarOpen"
          @close="closeSidebar"
          :collapsed="sidebarCollapsed"
          @toggle-collapse="toggleSidebar"
          class="h-full w-full overflow-y-auto"
        />
      </div>
      
      <!-- Main Content - with margin to account for the fixed sidebar -->
      <main 
        class="w-full min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out bg-gray-50 p-4 sm:p-6 dark:bg-gray-900"
        :class="{ 
          'lg:ml-64': !sidebarCollapsed && !isMobileView,
          'lg:ml-16': sidebarCollapsed && !isMobileView,
          'pb-20': isMobileView && showMobileNav // Add padding at bottom for mobile nav when visible
        }"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    
    <!-- Mobile Bottom Navigation -->
    <MobileNavBar v-if="isMobileView && showMobileNav" />
    
    <!-- Notifications -->
    <Toast position="bottom-right" />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, provide } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useRoute } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import AppSidebar from '../components/common/AppSidebar.vue'
import MobileNavBar from '../components/common/MobileNavBar.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

// State
const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const windowWidth = ref(window.innerWidth)
const previousWindowWidth = ref(window.innerWidth) // Track previous window width

// Methods - Define these before providing them
// Close sidebar with a specific method to ensure consistent behavior
const closeSidebar = () => {
  // Ensure this doesn't trigger immediately with other transitions
  setTimeout(() => {
    sidebarOpen.value = false;
  }, 50);
}

// Toggle sidebar collapse state
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  // Persist this setting in localStorage
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString());
}

// Now provide the state and methods to child components
provide('sidebarOpen', sidebarOpen)
provide('sidebarCollapsed', sidebarCollapsed)
provide('toggleSidebar', () => {
  sidebarOpen.value = !sidebarOpen.value
})
provide('closeSidebar', closeSidebar)
provide('theme', themeStore.theme)

// Computed properties
// Responsive breakpoints
const isMobileView = computed(() => windowWidth.value < 1024)

// Only show mobile nav when not on dashboard (to avoid redundancy)
const showMobileNav = computed(() => {
  return route.path !== '/' && route.name !== 'dashboard';
})

// Lifecycle hooks
onMounted(() => {
  authStore.checkToken()
  window.addEventListener('resize', handleResize)
  
  // Restore sidebar state from localStorage
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === 'true'
  }
  
  // Initial resize check
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Watch for theme changes
watch(() => themeStore.theme, (newTheme) => {
  document.documentElement.classList.toggle('dark', 
    newTheme === 'dark' || 
    (newTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
})

// Window resize handler - improved to only auto-close when transitioning from desktop to mobile
const handleResize = () => {
  previousWindowWidth.value = windowWidth.value
  windowWidth.value = window.innerWidth
  
  // Only auto-close sidebar when transitioning from desktop to mobile
  if (previousWindowWidth.value >= 1024 && windowWidth.value < 1024 && sidebarOpen.value) {
    sidebarOpen.value = false
  }
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Additional styles for shadow on scroll */
main {
  z-index: 1;
}

/* Toast styling for dark mode */
.dark .p-toast {
  @apply bg-gray-800 border-gray-700;
}

.dark .p-toast .p-toast-message {
  @apply bg-gray-800 text-gray-200 border-gray-700;
}

.dark .p-toast .p-toast-message .p-toast-message-content {
  @apply bg-gray-800 text-gray-200;
}

.dark .p-toast .p-toast-message .p-toast-message-content .p-toast-summary {
  @apply text-gray-200;
}

.dark .p-toast .p-toast-message .p-toast-message-content .p-toast-detail {
  @apply text-gray-300;
}

.dark .p-toast .p-toast-message .p-toast-icon-close {
  @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
}

/* Success toast */
.dark .p-toast .p-toast-message.p-toast-message-success {
  @apply bg-green-900/30 border-green-700;
}

.dark .p-toast .p-toast-message.p-toast-message-success .p-toast-message-icon {
  @apply text-green-400;
}

/* Info toast */
.dark .p-toast .p-toast-message.p-toast-message-info {
  @apply bg-blue-900/30 border-blue-700;
}

.dark .p-toast .p-toast-message.p-toast-message-info .p-toast-message-icon {
  @apply text-blue-400;
}

/* Warning toast */
.dark .p-toast .p-toast-message.p-toast-message-warn {
  @apply bg-amber-900/30 border-amber-700;
}

.dark .p-toast .p-toast-message.p-toast-message-warn .p-toast-message-icon {
  @apply text-amber-400;
}

/* Error toast */
.dark .p-toast .p-toast-message.p-toast-message-error {
  @apply bg-red-900/30 border-red-700;
}

.dark .p-toast .p-toast-message.p-toast-message-error .p-toast-message-icon {
  @apply text-red-400;
}

/* Confirmation dialog styling */
.dark .p-dialog {
  @apply shadow-lg border border-gray-700;
}
</style>
