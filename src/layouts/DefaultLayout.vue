<!-- src/layouts/DefaultLayout.vue -->
<template>
  <div class="min-h-screen flex flex-col theme-transition">
    <!-- Fixed Header -->
    <AppHeader 
      @toggle-sidebar="toggleSidebar" 
      :sidebar-open="sidebarOpen"
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
          'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)]',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0', 
          sidebarCollapsed && !isMobileView ? 'w-16' : 'w-64'
        ]"
      >
        <AppSidebar 
          :open="sidebarOpen"
          @close="closeSidebar"
          :collapsed="sidebarCollapsed"
          @toggle-collapse="toggleSidebarCollapse"
          class="h-full w-full overflow-y-auto"
        />
      </div>
      
      <!-- Main Content - with margin to account for the fixed sidebar -->
      <main 
        :class="[
          'w-full min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out p-4 sm:p-6',
          backgroundColor.primary,
          { 
            'lg:ml-64': !sidebarCollapsed && !isMobileView,
            'lg:ml-16': sidebarCollapsed && !isMobileView,
            'pb-20': isMobileView && showMobileNav // Add padding at bottom for mobile nav when visible
          }
        ]"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    
    <!-- Notifications -->
    <Toast position="bottom-right" />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, provide } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useTheme } from '../composables/useTheme'
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

// Theme composable for theme-aware styling
const { backgroundColor, textColor } = useTheme()

// Methods - Define these before providing them
// Close sidebar with a specific method to ensure consistent behavior
const closeSidebar = () => {
  // Ensure this doesn't trigger immediately with other transitions
  setTimeout(() => {
    sidebarOpen.value = false;
  }, 50);
}

// Toggle sidebar open/closed
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
}

// Toggle sidebar collapse state (expanded/collapsed)
const toggleSidebarCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  // Persist this setting in localStorage
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString());
}

// Now provide the state and methods to child components
provide('sidebarOpen', sidebarOpen)
provide('sidebarCollapsed', sidebarCollapsed)
provide('toggleSidebar', toggleSidebar)
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

/* Fix z-index for components */
main {
  z-index: 1;
}

/* Ensure all overlay components appear on top */
.p-component-overlay, 
.p-dialog-mask,
.p-overlaypanel,
.p-dropdown-panel,
.p-multiselect-panel {
  z-index: 1000 !important;
}

/* Fix for mobile */
@media (max-width: 1023px) {
  .mobile-menu-button {
    display: flex !important;
  }
}
@media (min-width: 1024px) {
  .mobile-menu-button {
    display: none !important;
  }
}

/* Theme transitions */
.theme-transition,
.theme-transition * {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: ease;
  transition-duration: 0.2s;
}
</style>
