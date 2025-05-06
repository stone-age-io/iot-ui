// src/composables/useWindowSize.js
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for tracking window size
 * Provides reactive width and height values
 * 
 * @returns {Object} - Window size state and helpers
 */
export function useWindowSize() {
  // Reactive state for window dimensions
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)
  
  /**
   * Handler for window resize events
   */
  const handleResize = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }
  
  // Set up and clean up the event listener
  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
  
  // Computed breakpoints
  const isXs = () => width.value < 640
  const isSm = () => width.value >= 640 && width.value < 768
  const isMd = () => width.value >= 768 && width.value < 1024
  const isLg = () => width.value >= 1024 && width.value < 1280
  const isXl = () => width.value >= 1280
  
  return {
    width,
    height,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl
  }
}
