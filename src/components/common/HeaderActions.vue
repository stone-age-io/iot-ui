<!-- src/components/common/HeaderActions.vue -->
<template>
  <div class="header-actions-wrapper relative">
    <!-- Single action button on mobile, multiple buttons on desktop -->
    <div class="flex items-center space-x-1">
      <!-- Theme Toggle - Desktop only -->
      <div class="hidden md:block">
        <ThemeToggle />
      </div>
      
      <!-- On mobile: Consolidated menu button -->
      <button
        type="button"
        class="md:hidden p-button p-button-text p-button-rounded action-button"
        @click="toggleMenu"
        title="Actions menu"
        aria-label="Actions menu"
        aria-haspopup="true"
        :aria-expanded="isMenuOpen ? 'true' : 'false'"
      >
        <span class="p-button-icon p-button-icon-only">
          <i class="pi pi-ellipsis-v"></i>
        </span>
      </button>
    </div>

    <!-- Consolidated dropdown menu -->
    <div
      v-show="isMenuOpen"
      class="actions-menu-dropdown bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark rounded-md shadow-theme-md theme-transition"
      ref="actionsMenuDropdown"
    >
      <div class="py-1" role="menu">
        <!-- Theme toggle option -->
        <button
          class="action-menu-item w-full text-left text-content-primary dark:text-content-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark"
          role="menuitem"
          @click="toggleThemeFromMenu"
        >
          <i :class="['action-menu-icon text-content-secondary dark:text-content-secondary-dark', currentThemeIcon]"></i>
          <span>{{ themeLabel }}</span>
        </button>
        
        <!-- Clear page cache option -->
        <button
          class="action-menu-item w-full text-left text-content-primary dark:text-content-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark"
          role="menuitem"
          @click="clearPageCache"
        >
          <i class="pi pi-sync action-menu-icon text-content-secondary dark:text-content-secondary-dark"></i>
          <span>Clear Page Cache</span>
        </button>
        
        <!-- Clear all cache option -->
        <button
          class="action-menu-item w-full text-left text-content-primary dark:text-content-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark"
          role="menuitem"
          @click="clearAllCacheHandler"
        >
          <i class="pi pi-trash action-menu-icon text-content-secondary dark:text-content-secondary-dark"></i>
          <span>Clear All Cache</span>
        </button>
      </div>
    </div>
  </div>
  
  <!-- Backdrop overlay that closes the menu when clicking outside -->
  <div
    v-if="isMenuOpen"
    class="fixed inset-0 z-30 bg-transparent"
    @click="closeMenu"
  ></div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useThemeStore } from '../../stores/theme';
import { clearAllCache, clearCollectionCache } from '../../utils/cacheUtils';
import ThemeToggle from './ThemeToggle.vue';

const props = defineProps({
  collectionName: {
    type: String,
    default: null
  }
});

const router = useRouter();
const toast = useToast();
const themeStore = useThemeStore();
const isMenuOpen = ref(false);
const actionsMenuDropdown = ref(null);

// Theme-related computed properties
const currentThemeIcon = computed(() => {
  switch(themeStore.theme) {
    case 'light': return 'pi pi-sun';
    case 'dark': return 'pi pi-moon';
    default: return 'pi pi-desktop';
  }
});

const themeLabel = computed(() => {
  switch(themeStore.theme) {
    case 'light': return 'Switch to Dark Theme';
    case 'dark': return 'Switch to System Theme';
    default: return 'Switch to Light Theme';
  }
});

// Toggle actions menu
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// Close actions menu
const closeMenu = () => {
  isMenuOpen.value = false;
};

// Force data refresh with skipCache
const forceRefresh = () => {
  // Add skipCache parameter and reload data
  router.replace({
    path: router.currentRoute.value.path,
    query: { 
      ...router.currentRoute.value.query, 
      _refresh: Date.now(),
      skipCache: true
    }
  }).then(() => {
    // Remove skipCache parameter after delay
    setTimeout(() => {
      if (router.currentRoute.value.query.skipCache) {
        const query = { ...router.currentRoute.value.query };
        delete query.skipCache;
        router.replace({
          path: router.currentRoute.value.path,
          query
        });
      }
    }, 1000);
  });
};

// Toggle theme from menu
const toggleThemeFromMenu = () => {
  const currentTheme = themeStore.theme;
  if (currentTheme === 'light') themeStore.setTheme('dark');
  else if (currentTheme === 'dark') themeStore.setTheme('auto');
  else themeStore.setTheme('light');
  
  closeMenu();
};

// Clear cache for the current page/collection
const clearPageCache = () => {
  if (props.collectionName) {
    clearCollectionCache(props.collectionName);
    
    toast.add({
      severity: 'success',
      summary: 'Cache Cleared',
      detail: `Cache for ${props.collectionName} has been cleared`,
      life: 2000
    });
    
    forceRefresh();
  }
  closeMenu();
};

// Clear all cache
const clearAllCacheHandler = () => {
  clearAllCache();
  
  toast.add({
    severity: 'success',
    summary: 'Cache Cleared',
    detail: 'All cached data has been cleared',
    life: 2000
  });
  
  forceRefresh();
  closeMenu();
};

// Handle click outside to close menu
const handleClickOutside = (event) => {
  if (isMenuOpen.value && actionsMenuDropdown.value) {
    const dropdown = actionsMenuDropdown.value;
    const isClickInsideDropdown = dropdown.contains(event.target);
    const isClickInsideButton = event.target.closest('.action-button');
    
    if (!isClickInsideDropdown && !isClickInsideButton) {
      closeMenu();
    }
  }
};

// Handle escape key to close menu
const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && isMenuOpen.value) {
    closeMenu();
  }
};

// Add event listeners
onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey);
  document.addEventListener('click', handleClickOutside);
});

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscapeKey);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.header-actions-wrapper {
  position: relative;
  display: inline-flex;
  gap: 0.25rem;
}

.action-button {
  position: relative;
  width: 2.5rem !important;
  height: 2.5rem !important;
  min-width: 2.5rem !important;
  min-height: 2.5rem !important;
  padding: 0 !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
  border-radius: 50% !important;
  transition: background-color 0.2s ease !important;
  z-index: 40;
}

.action-button:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

.dark .action-button:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

.action-button .p-button-icon {
  margin: 0 !important;
  font-size: 1.25rem !important;
}

/* Actions menu dropdown styling */
.actions-menu-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  width: 200px;
  z-index: 50;
  animation: dropdown-in 0.15s ease-out;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-menu-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  text-decoration: none;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.action-menu-icon {
  margin-right: 0.75rem;
}
</style>
