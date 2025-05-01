// src/composables/useTheme.js
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useThemeStore } from '../stores/theme'

/**
 * Composable for accessing theme information and functionality
 * Provides reactive theme state for components
 * 
 * @returns {Object} Theme utilities and state
 */
export function useTheme() {
  const themeStore = useThemeStore()
  
  // Track system preference changes
  const systemPrefersDark = ref(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  
  // Computed property to check if dark mode is active
  const isDarkMode = computed(() => {
    return themeStore.theme === 'dark' || 
      (themeStore.theme === 'auto' && systemPrefersDark.value)
  })
  
  // Listen for system preference changes
  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateSystemPreference = (e) => {
      systemPrefersDark.value = e.matches
    }
    
    // Modern API (addEventListener)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemPreference)
    } 
    // Legacy API (addListener) - for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(updateSystemPreference)
    }
    
    // Cleanup function
    onUnmounted(() => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateSystemPreference)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(updateSystemPreference)
      }
    })
    
    // Listen for theme change events (from the theme store)
    const handleThemeEvent = () => {
      // This will update any computed properties that depend on the theme
    }
    
    window.addEventListener('theme-changed', handleThemeEvent)
    window.addEventListener('system-theme-changed', (e) => {
      systemPrefersDark.value = e.detail.isDark
    })
    
    onUnmounted(() => {
      window.removeEventListener('theme-changed', handleThemeEvent)
      window.removeEventListener('system-theme-changed', handleThemeEvent)
    })
  })
  
  // Reactively apply theme classes to the root element
  watch(isDarkMode, (newIsDark) => {
    document.documentElement.classList.toggle('dark', newIsDark)
  }, { immediate: true })
  
  // Methods to change theme
  const setLightTheme = () => themeStore.setTheme('light')
  const setDarkTheme = () => themeStore.setTheme('dark')
  const setSystemTheme = () => themeStore.setTheme('auto')
  
  // Toggle between themes (light -> dark -> auto -> light)
  const toggleTheme = () => {
    const currentTheme = themeStore.theme
    if (currentTheme === 'light') themeStore.setTheme('dark')
    else if (currentTheme === 'dark') themeStore.setTheme('auto')
    else themeStore.setTheme('light')
  }
  
  return {
    // Current theme state
    currentTheme: computed(() => themeStore.theme),
    isDarkMode,
    systemPrefersDark,
    
    // Theme change methods
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    toggleTheme
  }
}
