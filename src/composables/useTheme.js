// src/composables/useTheme.js
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '../stores/theme'

/**
 * Composable for accessing theme information and functionality
 * Provides reactive theme state and utilities for components
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
  
  // Helper to get theme-specific value
  const themeValue = computed(() => {
    return {
      // Return different values based on theme
      value: (lightValue, darkValue) => isDarkMode.value ? darkValue : lightValue,
      
      // Return different class names based on theme
      class: (lightClass, darkClass) => isDarkMode.value ? darkClass : lightClass,
      
      // For CSS variables - gets the current value
      cssVar: (variableName) => {
        const value = getComputedStyle(document.documentElement)
          .getPropertyValue(variableName)
          .trim()
        return value
      }
    }
  })
  
  // Helper for theme-specific background colors
  const backgroundColor = computed(() => {
    return {
      primary: isDarkMode.value ? 'bg-gray-800' : 'bg-white',
      secondary: isDarkMode.value ? 'bg-gray-700' : 'bg-gray-50',
      highlight: isDarkMode.value ? 'bg-gray-700' : 'bg-blue-50'
    }
  })
  
  // Helper for theme-specific text colors
  const textColor = computed(() => {
    return {
      primary: isDarkMode.value ? 'text-gray-200' : 'text-gray-900',
      secondary: isDarkMode.value ? 'text-gray-400' : 'text-gray-500',
      muted: isDarkMode.value ? 'text-gray-500' : 'text-gray-400'
    }
  })
  
  // Helper for theme-specific border colors
  const borderColor = computed(() => {
    return {
      default: isDarkMode.value ? 'border-gray-700' : 'border-gray-200',
      light: isDarkMode.value ? 'border-gray-600' : 'border-gray-100',
      dark: isDarkMode.value ? 'border-gray-800' : 'border-gray-300'
    }
  })
  
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
  
  return {
    // Current theme state
    currentTheme: computed(() => themeStore.theme),
    isDarkMode,
    systemPrefersDark,
    
    // Theme-specific values
    themeValue,
    backgroundColor,
    textColor,
    borderColor,
    
    // Theme change methods
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    toggleTheme
  }
}
