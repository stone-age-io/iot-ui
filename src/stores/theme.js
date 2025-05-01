// src/stores/theme.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // State - default to 'auto' which follows system preference
  const theme = ref(localStorage.getItem('theme') || 'auto')
  
  /**
   * Set the application theme and persist the preference
   * @param {string} newTheme - 'light', 'dark', or 'auto'
   */
  function setTheme(newTheme) {
    if (!['light', 'dark', 'auto'].includes(newTheme)) return
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
    
    // Dispatch a custom event that components can listen for
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: newTheme }}))
  }
  
  /**
   * Apply the selected theme to the document
   * @param {string} selectedTheme - The theme to apply
   */
  function applyTheme(selectedTheme) {
    const isDark = selectedTheme === 'dark' || 
      (selectedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    // Update document class for Tailwind dark mode
    document.documentElement.classList.toggle('dark', isDark)
  }
  
  /**
   * Check if dark mode is currently active
   * @returns {boolean} - Whether dark mode is active
   */
  function isDarkModeActive() {
    return theme.value === 'dark' || 
      (theme.value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  }
  
  /**
   * Set up system preference listener and apply initial theme
   */
  function init() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    // Initial setup
    applyTheme(theme.value)
    
    // Watch for system changes
    const handleMediaChange = () => {
      if (theme.value === 'auto') {
        applyTheme('auto')
        
        // Dispatch event for components to react to system theme change
        window.dispatchEvent(new CustomEvent('system-theme-changed', { 
          detail: { isDark: mediaQuery.matches }
        }))
      }
    }
    
    // Use correct event listener based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange)
    } else if (mediaQuery.addListener) {
      // Older browsers
      mediaQuery.addListener(handleMediaChange)
    }
  }
  
  return { 
    theme, 
    setTheme, 
    applyTheme,
    isDarkModeActive,
    init
  }
})
