<!-- src/layouts/DefaultLayout.vue -->
<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <AppHeader 
      @toggle-sidebar="sidebarOpen = !sidebarOpen" 
      :sidebar-open="sidebarOpen"
    />
    
    <div class="flex flex-1 relative">
      <!-- Mobile Overlay -->
      <div 
        v-if="sidebarOpen" 
        class="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
        @click="sidebarOpen = false"
      ></div>
      
      <!-- Sidebar - Off-canvas on mobile, sidebar on desktop -->
      <AppSidebar 
        :open="sidebarOpen"
        @close="sidebarOpen = false"
        :collapsed="sidebarCollapsed"
        @toggle-collapse="toggleSidebar"
        class="fixed z-30 lg:relative"
      />
      
      <!-- Main Content -->
      <main 
        class="flex-1 bg-gray-50 p-4 sm:p-6 w-full overflow-x-hidden"
        :class="{ 
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
    
    <!-- Mobile Bottom Navigation - only show when not on dashboard -->
    <MobileNavBar v-if="isMobileView && showMobileNav" />
    
    <!-- Notifications -->
    <Toast position="bottom-right" />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRoute } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import AppSidebar from '../components/common/AppSidebar.vue'
import MobileNavBar from '../components/common/MobileNavBar.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const authStore = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const windowWidth = ref(window.innerWidth)

// Responsive breakpoints
const isMobileView = computed(() => windowWidth.value < 1024)

// Only show mobile nav when not on dashboard (to avoid redundancy)
const showMobileNav = computed(() => {
  return route.path !== '/' && route.name !== 'dashboard';
})

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth
  
  // Auto-close sidebar on small screens
  if (windowWidth.value < 1024 && sidebarOpen.value) {
    sidebarOpen.value = false
  }
}

// Toggle sidebar collapse state
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  // You might want to persist this setting in localStorage
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
}

// Check authentication on component mount
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
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
