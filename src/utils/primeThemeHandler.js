// src/utils/primeThemeHandler.js
/**
 * Handles PrimeVue theme switching based on the current application theme
 * @param {string} theme - The current theme ('light', 'dark', or 'auto')
 */
export function setupPrimeVueTheme(theme) {
  // Determine if we should use dark mode
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
  
  // Set data attribute on HTML for global CSS selector access
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  
  // Update PrimeVue CSS variables (can be customized further)
  updatePrimeVueVariables(isDark)
}

/**
 * Updates PrimeVue CSS variables to better integrate with our theme
 * @param {boolean} isDark - Whether dark mode is active
 */
function updatePrimeVueVariables(isDark) {
  // Create a style element for our custom overrides
  let customStyle = document.getElementById('prime-custom-vars')
  
  if (!customStyle) {
    customStyle = document.createElement('style')
    customStyle.id = 'prime-custom-vars'
    document.head.appendChild(customStyle)
  }
  
  // Define theme-specific overrides
  const lightOverrides = `
    :root {
      --primary-color: #3B82F6;
      --primary-color-text: #ffffff;
      --surface-ground: #f8fafc;
      --surface-section: #ffffff;
      --surface-card: #ffffff;
      --surface-overlay: #ffffff;
      --surface-border: #e2e8f0;
      --surface-hover: #f1f5f9;
      --focus-ring: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
    }
  `
  
  const darkOverrides = `
    :root {
      --primary-color: #60A5FA;
      --primary-color-text: #1e293b;
      --surface-ground: #1e293b;
      --surface-section: #1e293b;
      --surface-card: #1e293b;
      --surface-overlay: #1e293b;
      --surface-border: #475569;
      --surface-hover: #334155;
      --focus-ring: 0 0 0 0.2rem rgba(96, 165, 250, 0.25);
    }
  `
  
  // Apply the appropriate overrides
  customStyle.textContent = isDark ? darkOverrides : lightOverrides
}
