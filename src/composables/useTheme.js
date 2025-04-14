// src/composables/useTheme.js
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
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
  
  // Generate a themeValue object with helper methods
  const themeValue = computed(() => {
    return {
      /**
       * Returns different values based on the current theme
       * @param {any} lightValue - Value for light theme
       * @param {any} darkValue - Value for dark theme
       * @returns {any} - The appropriate value for the current theme
       */
      value: (lightValue, darkValue) => isDarkMode.value ? darkValue : lightValue,
      
      /**
       * Returns different class names based on the current theme
       * @param {string} lightClass - CSS class for light theme
       * @param {string} darkClass - CSS class for dark theme
       * @returns {string} - The appropriate class for the current theme
       */
      class: (lightClass, darkClass) => isDarkMode.value ? darkClass : lightClass,
      
      /**
       * Gets the current value of a CSS variable
       * @param {string} variableName - CSS variable name (including leading --)
       * @returns {string} - Current value of the CSS variable
       */
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
      tertiary: isDarkMode.value ? 'bg-gray-900' : 'bg-gray-100',
      accent: isDarkMode.value ? 'bg-blue-900/20' : 'bg-blue-50',
      highlight: isDarkMode.value ? 'bg-amber-900/20' : 'bg-amber-50'
    }
  })
  
  // Helper for theme-specific text colors
  const textColor = computed(() => {
    return {
      primary: isDarkMode.value ? 'text-gray-200' : 'text-gray-900',
      secondary: isDarkMode.value ? 'text-gray-400' : 'text-gray-500',
      muted: isDarkMode.value ? 'text-gray-500' : 'text-gray-400',
      accent: isDarkMode.value ? 'text-blue-400' : 'text-blue-600',
      warning: isDarkMode.value ? 'text-amber-400' : 'text-amber-600',
      error: isDarkMode.value ? 'text-red-400' : 'text-red-600',
      success: isDarkMode.value ? 'text-green-400' : 'text-green-600'
    }
  })
  
  // Helper for theme-specific border colors
  const borderColor = computed(() => {
    return {
      default: isDarkMode.value ? 'border-gray-700' : 'border-gray-200',
      light: isDarkMode.value ? 'border-gray-600' : 'border-gray-100',
      dark: isDarkMode.value ? 'border-gray-800' : 'border-gray-300',
      accent: isDarkMode.value ? 'border-blue-800' : 'border-blue-200'
    }
  })

  // Helper for theme-specific shadow styles
  const shadowStyle = computed(() => {
    return {
      sm: isDarkMode.value ? 'shadow-sm shadow-gray-900/50' : 'shadow-sm',
      md: isDarkMode.value ? 'shadow shadow-gray-900/50' : 'shadow',
      lg: isDarkMode.value ? 'shadow-lg shadow-gray-900/50' : 'shadow-lg',
      xl: isDarkMode.value ? 'shadow-xl shadow-gray-900/50' : 'shadow-xl'
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

  // Get CSS custom properties for a given element
  const getCssCustomProperties = (element = document.documentElement) => {
    const properties = {}
    const styles = getComputedStyle(element)
    
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i]
      if (prop.startsWith('--')) {
        properties[prop] = styles.getPropertyValue(prop).trim()
      }
    }
    
    return properties
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
  
  // Reactively apply theme classes to the root element
  watch(isDarkMode, (newIsDark) => {
    document.documentElement.classList.toggle('dark', newIsDark)
  }, { immediate: true })
  
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
    shadowStyle,
    
    // CSS variables
    getCssCustomProperties,
    
    // Theme change methods
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    toggleTheme
  }
}
