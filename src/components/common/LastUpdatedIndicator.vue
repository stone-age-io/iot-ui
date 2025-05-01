<!-- src/components/common/LastUpdatedIndicator.vue -->
<template>
  <div class="last-updated-indicator theme-transition p-2" :class="{ 'is-updating': isRefreshing }">
    <span v-if="isRefreshing" class="refresh-indicator text-primary-600 dark:text-primary-400 flex items-center">
      <i class="pi pi-spin pi-sync mr-1"></i> Updating...
    </span>
    <span v-else-if="timestamp" class="timestamp text-content-secondary dark:text-content-secondary-dark flex items-center">
      <i class="pi pi-clock mr-1"></i> Last updated: {{ formattedTime }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCacheStore } from '../../stores/cacheStore';

const cacheStore = useCacheStore();

const timestamp = computed(() => cacheStore.currentTimestamp);
const isRefreshing = computed(() => cacheStore.isRefreshing);

// Format timestamp to human-readable time
const formattedTime = computed(() => {
  if (!timestamp.value) return '';
  
  try {
    const date = new Date(timestamp.value);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    // Format for today's dates
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } else {
      // Format for earlier dates
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (e) {
    console.error('Error formatting timestamp:', e);
    return 'Unknown';
  }
});
</script>

<style scoped>
.last-updated-indicator {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
}
</style>
