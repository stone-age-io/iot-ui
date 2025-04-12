// src/stores/theme.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // State - default to 'auto' which follows system preference
  const theme = ref(localStorage.getItem('theme') || 'auto')
  
  // Actions to change theme
  function setTheme(newTheme) {
    if (!['light', 'dark', 'auto'].includes(newTheme)) return
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }
  
  // Apply theme to document
  function applyTheme(selectedTheme) {
    const isDark = selectedTheme === 'dark' || 
      (selectedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  
  // Initialize and listen for system preference changes
  function setupThemeWatcher() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    // Initial setup
    applyTheme(theme.value)
    
    // Watch for system changes
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme('auto')
      }
    })
  }
  
  // Initialize
  setupThemeWatcher()
  
  return { theme, setTheme }
})
