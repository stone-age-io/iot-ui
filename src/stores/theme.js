// src/stores/theme.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { setupPrimeVueTheme } from '../utils/primeThemeHandler'

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
   * Apply the selected theme to the document and update CSS variables
   * @param {string} selectedTheme - The theme to apply
   */
  function applyTheme(selectedTheme) {
    const isDark = selectedTheme === 'dark' || 
      (selectedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    // Update document class
    document.documentElement.classList.toggle('dark', isDark)
    
    // Update data attribute for other selectors
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    
    // Update PrimeVue theme
    setupPrimeVueTheme(selectedTheme)
    
    // Update CSS variables for consistent theming
    updateCssVariables(isDark)
  }
  
  /**
   * Update global CSS variables for theme consistency
   * @param {boolean} isDark - Whether dark mode is active
   */
  function updateCssVariables(isDark) {
    const root = document.documentElement
    
    if (isDark) {
      // Dark theme variables
      root.style.setProperty('--color-bg', '17, 24, 39') // bg-gray-900
      root.style.setProperty('--color-surface', '31, 41, 55') // bg-gray-800
      root.style.setProperty('--color-border', '75, 85, 99') // border-gray-600
      root.style.setProperty('--color-text', '229, 231, 235') // text-gray-200
      root.style.setProperty('--color-text-secondary', '156, 163, 175') // text-gray-400
      
      // PrimeVue dark theme variables
      root.style.setProperty('--primary-color', '#60A5FA')
      root.style.setProperty('--surface-ground', 'rgb(17, 24, 39)')
      root.style.setProperty('--surface-card', 'rgb(31, 41, 55)')
      root.style.setProperty('--surface-border', 'rgb(75, 85, 99)')
      root.style.setProperty('--text-color', 'rgb(229, 231, 235)')
      root.style.setProperty('--text-color-secondary', 'rgb(156, 163, 175)')
    } else {
      // Light theme variables
      root.style.setProperty('--color-bg', '249, 250, 251') // bg-gray-50
      root.style.setProperty('--color-surface', '255, 255, 255') // white
      root.style.setProperty('--color-border', '229, 231, 235') // border-gray-200
      root.style.setProperty('--color-text', '17, 24, 39') // text-gray-900
      root.style.setProperty('--color-text-secondary', '107, 114, 128') // text-gray-500
      
      // PrimeVue light theme variables
      root.style.setProperty('--primary-color', '#3B82F6')
      root.style.setProperty('--surface-ground', 'rgb(249, 250, 251)')
      root.style.setProperty('--surface-card', 'rgb(255, 255, 255)')
      root.style.setProperty('--surface-border', 'rgb(229, 231, 235)')
      root.style.setProperty('--text-color', 'rgb(17, 24, 39)')
      root.style.setProperty('--text-color-secondary', 'rgb(107, 114, 128)')
    }
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
  function setupThemeWatcher() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    // Initial setup
    applyTheme(theme.value)
    
    // Watch for system changes
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme('auto')
        
        // Dispatch event for components to react to system theme change
        window.dispatchEvent(new CustomEvent('system-theme-changed', { 
          detail: { isDark: mediaQuery.matches }
        }))
      }
    })
    
    // Watch for theme changes in the store
    watch(theme, (newTheme) => {
      applyTheme(newTheme)
    })
  }
  
  // Initialize when used in components
  function init() {
    setupThemeWatcher()
  }
  
  return { 
    theme, 
    setTheme, 
    applyTheme,
    isDarkModeActive,
    init
  }
})
