<template>
  <div class="cache-control-wrapper">
    <button
      type="button"
      class="p-button p-button-text p-button-rounded cache-refresh-button"
      @click="refreshCache"
      :title="refreshing ? 'Refreshing data...' : 'Refresh data'"
      :disabled="refreshing"
      aria-label="Refresh data"
    >
      <span class="p-button-icon p-button-icon-only">
        <i class="pi pi-refresh" :class="{ 'spin-animation': refreshing }"></i>
      </span>
    </button>

    <!-- Menu trigger button -->
    <button
      type="button"
      class="p-button p-button-text p-button-rounded cache-menu-button"
      @click="toggleMenu"
      title="Cache options"
      aria-label="Cache options"
      aria-haspopup="true"
      :aria-expanded="isMenuOpen ? 'true' : 'false'"
    >
      <span class="p-button-icon p-button-icon-only">
        <i class="pi pi-ellipsis-v"></i>
      </span>
    </button>

    <!-- Cache options dropdown menu -->
    <div
      v-show="isMenuOpen"
      class="cache-menu-dropdown"
      ref="cacheMenuDropdown"
    >
      <div class="py-1" role="menu">
        <button
          class="cache-menu-item w-full text-left"
          role="menuitem"
          @click="clearPageCache"
        >
          <i class="pi pi-refresh cache-menu-icon"></i>
          <span>Clear Page Cache</span>
        </button>
        
        <button
          class="cache-menu-item w-full text-left"
          role="menuitem"
          @click="clearAllCacheHandler"
        >
          <i class="pi pi-trash cache-menu-icon"></i>
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { clearAllCache, clearCollectionCache } from '../../utils/cacheUtils';

const props = defineProps({
  collectionName: {
    type: String,
    default: null
  },
  onRefresh: {
    type: Function,
    default: null
  }
});

const router = useRouter();
const toast = useToast();
const refreshing = ref(false);
const isMenuOpen = ref(false);
const cacheMenuDropdown = ref(null);

// Toggle cache options menu
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// Close cache options menu
const closeMenu = () => {
  isMenuOpen.value = false;
};

// Refresh the current page data
const refreshCache = async () => {
  if (refreshing.value) return;
  
  refreshing.value = true;
  
  try {
    if (props.collectionName) {
      clearCollectionCache(props.collectionName);
    }
    
    // Call the onRefresh callback if provided
    if (props.onRefresh) {
      await props.onRefresh();
    } else {
      // Default refresh method - reload current route with timestamp
      await router.replace({
        path: router.currentRoute.value.path,
        query: { ...router.currentRoute.value.query, _refresh: Date.now() }
      });
    }
    
    toast.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Data has been refreshed',
      life: 2000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to refresh data',
      life: 3000
    });
  } finally {
    refreshing.value = false;
  }
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
    
    // Reload data
    refreshCache();
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
  
  // Reload data
  refreshCache();
  closeMenu();
};

// Handle click outside to close menu
const handleClickOutside = (event) => {
  if (isMenuOpen.value && cacheMenuDropdown.value) {
    const dropdown = cacheMenuDropdown.value;
    const isClickInsideDropdown = dropdown.contains(event.target);
    const isClickInsideButton = event.target.closest('.cache-menu-button');
    
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
.cache-control-wrapper {
  position: relative;
  display: inline-flex;
  gap: 0.25rem;
}

.cache-refresh-button,
.cache-menu-button {
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
}

.cache-refresh-button:hover,
.cache-menu-button:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

.dark .cache-refresh-button:hover,
.dark .cache-menu-button:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

.cache-refresh-button:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

.cache-refresh-button .p-button-icon,
.cache-menu-button .p-button-icon {
  margin: 0 !important;
  font-size: 1.25rem !important;
}

/* Refresh animation */
.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Cache menu dropdown styling (matches user menu style) */
.cache-menu-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  width: 200px;
  background-color: rgb(var(--color-surface));
  border: 1px solid rgb(var(--color-border));
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 50;
  animation: dropdown-in 0.15s ease-out;
}

.dark .cache-menu-dropdown {
  background-color: #1f2937;
  border-color: #4b5563;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
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

.cache-menu-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: rgb(var(--color-text));
  text-decoration: none;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.cache-menu-item:hover {
  background-color: rgba(var(--color-text), 0.04);
}

.dark .cache-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.cache-menu-icon {
  margin-right: 0.75rem;
  color: rgb(var(--color-text-secondary));
}
</style>
