<template>
  <div class="last-updated-indicator" :class="{ 'is-updating': isRefreshing }">
    <span v-if="isRefreshing" class="refresh-indicator">
      <i class="pi pi-spin pi-sync"></i> Updating...
    </span>
    <span v-else-if="timestamp" class="timestamp">
      <i class="pi pi-clock"></i> Last updated: {{ formattedTime }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCacheStore } from '../../stores/cacheStore';
import { useTheme } from '../../composables/useTheme';

const cacheStore = useCacheStore();
const { isDarkMode } = useTheme();

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
  padding: 0.5rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.is-updating {
  color: var(--primary-color);
}

:deep(.pi) {
  margin-right: 0.25rem;
}

.timestamp, .refresh-indicator {
  display: flex;
  align-items: center;
}
</style>
