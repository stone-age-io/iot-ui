<!-- src/components/common/VirtualList.vue -->
<template>
  <div 
    ref="container" 
    class="virtual-list-container bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark rounded-lg overflow-y-auto theme-transition" 
    :style="{ height: containerHeight + 'px' }"
    @scroll="onScroll"
  >
    <div 
      class="virtual-list-spacer" 
      :style="{ height: totalHeight + 'px' }"
    >
      <div 
        class="virtual-list-visible-items" 
        :style="{ transform: `translateY(${startOffset}px)` }"
      >
        <slot 
          v-for="item in visibleItems" 
          :key="item.id" 
          :item="item"
          :index="item.originalIndex"
        ></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useTheme } from '../../composables/useTheme';

const props = defineProps({
  // List of items to render
  items: {
    type: Array,
    required: true
  },
  
  // Individual item height (can be fixed or estimated average)
  itemHeight: {
    type: Number,
    default: 100
  },
  
  // Container height
  containerHeight: {
    type: Number,
    default: 400
  },
  
  // Buffer size (number of items to render outside visible area)
  buffer: {
    type: Number,
    default: 3
  }
});

// Initialize theme
const { isDarkMode } = useTheme();

// References
const container = ref(null);
const scrollTop = ref(0);
const itemsWithMeta = ref([]);

// Update items with metadata for virtualization
watch(() => props.items, (newItems) => {
  // Add original index and height metadata to each item
  itemsWithMeta.value = newItems.map((item, index) => ({
    ...item,
    originalIndex: index,
    height: props.itemHeight,
    offset: index * props.itemHeight
  }));
}, { immediate: true, deep: true });

// Calculate total list height
const totalHeight = computed(() => {
  return itemsWithMeta.value.length * props.itemHeight;
});

// Calculate visible range
const visibleRange = computed(() => {
  if (!container.value) return { start: 0, end: 10 };
  
  const start = Math.floor(scrollTop.value / props.itemHeight);
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight);
  
  // Add buffer zones before and after visible area
  const bufferedStart = Math.max(0, start - props.buffer);
  const bufferedEnd = Math.min(
    itemsWithMeta.value.length, 
    start + visibleCount + props.buffer
  );
  
  return {
    start: bufferedStart,
    end: bufferedEnd
  };
});

// Get visible items based on the calculated range
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  return itemsWithMeta.value.slice(start, end);
});

// Calculate starting Y offset for the first visible item
const startOffset = computed(() => {
  const { start } = visibleRange.value;
  return start * props.itemHeight;
});

// Handle scroll events
const onScroll = () => {
  if (container.value) {
    scrollTop.value = container.value.scrollTop;
  }
};

// Initialize scroll position tracking
onMounted(() => {
  if (container.value) {
    scrollTop.value = container.value.scrollTop;
  }
  
  // Resize observer to handle container size changes
  const resizeObserver = new ResizeObserver(() => {
    onScroll();
  });
  
  if (container.value) {
    resizeObserver.observe(container.value);
  }
  
  // Clean up
  onUnmounted(() => {
    if (container.value) {
      resizeObserver.unobserve(container.value);
    }
    resizeObserver.disconnect();
  });
});

// Expose methods for parent components
defineExpose({
  // Scroll to specific item
  scrollToItem(index) {
    if (!container.value) return;
    
    const offset = index * props.itemHeight;
    container.value.scrollTop = offset;
  },
  
  // Scroll to top
  scrollToTop() {
    if (!container.value) return;
    container.value.scrollTop = 0;
  },
  
  // Scroll to bottom
  scrollToBottom() {
    if (!container.value) return;
    container.value.scrollTop = totalHeight.value - props.containerHeight;
  }
});
</script>

<style scoped>
.virtual-list-spacer {
  position: relative;
  width: 100%;
}

.virtual-list-visible-items {
  position: absolute;
  width: 100%;
  left: 0;
  will-change: transform;
}
</style>
