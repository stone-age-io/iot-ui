// src/utils/primeThemeHandler.js
/**
 * Handles PrimeVue theme switching based on the current application theme
 * @param {string} theme - The current theme ('light', 'dark', or 'auto')
 */
export function setupPrimeVueTheme(theme) {
  const isDark = theme === 'dark' || 
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  // Remove existing theme
  const oldTheme = document.getElementById('prime-theme')
  if (oldTheme) oldTheme.remove()
  
  // Add new theme link
  const link = document.createElement('link')
  link.id = 'prime-theme'
  link.rel = 'stylesheet'
  link.href = isDark 
    ? '/themes/lara-dark-blue/theme.css' 
    : '/themes/lara-light-blue/theme.css'
  
  document.head.appendChild(link)
}
