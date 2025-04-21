# Theming System Implementation

## Overview

The IoT Platform implements a comprehensive theming system that supports light and dark modes, system preference detection, and consistent styling across both custom components and third-party libraries like PrimeVue. The system uses CSS variables, Tailwind CSS dark mode, and centralized theme management to provide a cohesive visual experience.

## Theming Architecture

The theming system consists of several interconnected components:

1. **Theme Store**: Centralized Pinia store for theme state
2. **Theme Composable**: Reusable theme logic in `useTheme`
3. **CSS Variables**: Centralized theme values in CSS custom properties
4. **PrimeVue Integration**: Custom theme handling for the UI component library
5. **Tailwind Integration**: Dark mode utilities from Tailwind CSS

## Theme Store (Pinia)

The theme store manages the application's theme state:

```javascript
// src/stores/theme.js
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
    window.dispatchEvent(new CustomEvent('theme-changed', { 
      detail: { theme: newTheme }
    }))
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
  
  // Additional theme functions...
  
  return { 
    theme, 
    setTheme, 
    applyTheme,
    isDarkModeActive,
    init
  }
})
```

## Theme Composable

The `useTheme` composable provides components with reactive theme information and utility functions:

```javascript
// src/composables/useTheme.js
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
  
  // Additional helpers and methods...
  
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
```

## CSS Variables

The application defines core theme variables in CSS:

```css
/* src/assets/styles/theme-variables.css */
:root {
  /* Light theme (default) */
  --color-bg: 249, 250, 251; /* bg-gray-50 */
  --color-surface: 255, 255, 255; /* white */
  --color-border: 229, 231, 235; /* border-gray-200 */
  --color-text: 17, 24, 39; /* text-gray-900 */
  --color-text-secondary: 107, 114, 128; /* text-gray-500 */
  
  /* Primary colors */
  --primary-50: 239, 246, 255;
  --primary-100: 219, 234, 254;
  --primary-200: 191, 219, 254;
  --primary-300: 147, 197, 253;
  --primary-400: 96, 165, 250;
  --primary-500: 59, 130, 246;
  --primary-600: 37, 99, 235;
  --primary-700: 29, 78, 216;
  --primary-800: 30, 64, 175;
  --primary-900: 30, 58, 138;
  
  /* PrimeVue overrides */
  --primary-color: #3B82F6;
  --primary-color-text: #ffffff;
  --surface-ground: rgb(var(--color-bg));
  --surface-section: rgb(var(--color-surface));
  --surface-card: rgb(var(--color-surface));
  --surface-overlay: rgb(var(--color-surface));
  --surface-border: rgb(var(--color-border));
  --text-color: rgb(var(--color-text));
  --text-color-secondary: rgb(var(--color-text-secondary));
}

/* Dark theme overrides (applied via JavaScript) */
.dark {
  --color-bg: 17, 24, 39; /* bg-gray-900 */
  --color-surface: 31, 41, 55; /* bg-gray-800 */
  --color-border: 75, 85, 99; /* border-gray-600 */
  --color-text: 229, 231, 235; /* text-gray-200 */
  --color-text-secondary: 156, 163, 175; /* text-gray-400 */
}
```

These CSS variables are also updated programmatically:

```javascript
// Excerpt from src/stores/theme.js
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
    // ...more variables
  } else {
    // Light theme variables
    root.style.setProperty('--color-bg', '249, 250, 251') // bg-gray-50
    root.style.setProperty('--color-surface', '255, 255, 255') // white
    // ...more variables
  }
}
```

## PrimeVue Integration

The application integrates with PrimeVue's theming system:

```javascript
// src/utils/primeThemeHandler.js
export function setupPrimeVueTheme(theme) {
  // Determine if we should use dark mode
  const isDark = theme === 'dark' || 
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  // Update PrimeVue CSS variables
  updatePrimeVueVariables(isDark)
}

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
      --surface-ground: var(--color-bg, 249, 250, 251);
      --surface-section: var(--color-surface, 255, 255, 255);
      --surface-card: var(--color-surface, 255, 255, 255);
      --surface-overlay: var(--color-surface, 255, 255, 255);
      --surface-border: var(--color-border, 229, 231, 235);
      --surface-hover: #f1f5f9;
      --focus-ring: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
    }
  `
  
  const darkOverrides = `
    :root {
      --primary-color: #60A5FA;
      --primary-color-text: #1e293b;
      --surface-ground: var(--color-bg, 17, 24, 39);
      --surface-section: var(--color-surface, 31, 41, 55);
      --surface-card: var(--color-surface, 31, 41, 55);
      --surface-overlay: var(--color-surface, 31, 41, 55);
      --surface-border: var(--color-border, 75, 85, 99);
      --surface-hover: #334155;
      --focus-ring: 0 0 0 0.2rem rgba(96, 165, 250, 0.25);
    }
  `
  
  // Apply the appropriate overrides
  customStyle.textContent = isDark ? darkOverrides : lightOverrides
}
```

## Tailwind CSS Integration

Tailwind CSS provides utility classes for dark mode:

```javascript
// tailwind.config.js (not shown in code snippets but inferred)
module.exports = {
  // ...other settings
  darkMode: 'class', // Enable class-based dark mode
  // ...more config
}
```

The theme store toggles the `dark` class on the HTML element:

```javascript
// Excerpt from src/stores/theme.js
function applyTheme(selectedTheme) {
  const isDark = selectedTheme === 'dark' || 
    (selectedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  // Update document class for Tailwind dark mode
  document.documentElement.classList.toggle('dark', isDark)
  
  // ...other theme application logic
}
```

## Using the Theme System in Components

Components can use the theming system in several ways:

### 1. Direct Composable Usage

```vue
<template>
  <div :class="[
    'min-h-screen',
    backgroundColor.primary,
    textColor.primary
  ]">
    <h1 :class="[
      'text-2xl font-bold', 
      isDarkMode ? 'text-blue-300' : 'text-blue-600'
    ]">
      Dashboard
    </h1>
    
    <!-- Toggle theme button -->
    <button @click="toggleTheme">
      <span v-if="isDarkMode">☀️ Light Mode</span>
      <span v-else>🌙 Dark Mode</span>
    </button>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'

const { 
  isDarkMode, 
  backgroundColor, 
  textColor, 
  toggleTheme 
} = useTheme()
</script>
```

### 2. Dynamic Helper Classes

```vue
<template>
  <div :class="[
    'card p-4 rounded-lg shadow',
    backgroundColor.surface,
    borderColor.default
  ]">
    <h2 :class="textColor.primary">Card Title</h2>
    <p :class="textColor.secondary">Card content goes here...</p>
    
    <!-- Dynamic button styling -->
    <button :class="[
      'px-4 py-2 rounded',
      isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
      'text-white'
    ]">
      Submit
    </button>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'

const { 
  isDarkMode, 
  backgroundColor, 
  textColor, 
  borderColor 
} = useTheme()
</script>
```

### 3. Theme Value Helper

```vue
<template>
  <div :class="backgroundColor.primary">
    <!-- Using themeValue for dynamic values -->
    <div :style="{ 
      color: themeValue.value('#1e40af', '#93c5fd'),
      backgroundColor: themeValue.value('#f9fafb', '#1f2937') 
    }">
      Custom Styled Element
    </div>
    
    <!-- Using themeValue for dynamic classes -->
    <div :class="themeValue.class(
      'bg-white text-gray-900 border-gray-200', 
      'bg-gray-800 text-gray-200 border-gray-700'
    )">
      Element with theme-specific classes
    </div>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'

const { backgroundColor, themeValue } = useTheme()
</script>
```

### 4. Tailwind Dark Mode Classes

```vue
<template>
  <!-- Using Tailwind's dark: variant -->
  <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-4">
    <h2 class="text-xl font-bold text-blue-600 dark:text-blue-400">
      Using Tailwind Dark Mode
    </h2>
    <p class="mt-2 text-gray-600 dark:text-gray-400">
      This paragraph uses Tailwind's dark mode variant
    </p>
  </div>
</template>
```

## System Preference Detection

The theme system detects and respects system preferences:

```javascript
// src/composables/useTheme.js
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
})

// Watch for theme changes and update the DOM
watch(isDarkMode, (newIsDark) => {
  document.documentElement.classList.toggle('dark', newIsDark)
}, { immediate: true })
```

## Theme Initialization

The theme system is initialized early in the application lifecycle:

```javascript
// src/main.js
// Initialize theme before mounting
const themeStore = useThemeStore()

// Initialize the theme system
themeStore.init()

// The rest of the app setup...
```

## Themed Components

Components like layouts leverage the theming system:

```vue
<!-- src/layouts/DefaultLayout.vue -->
<template>
  <div class="min-h-screen flex flex-col theme-transition">
    <!-- Main Content -->
    <main 
      :class="[
        'w-full min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out p-4 sm:p-6',
        backgroundColor.primary,
        { 
          'lg:ml-64': !sidebarCollapsed && !isMobileView,
          'lg:ml-16': sidebarCollapsed && !isMobileView,
          'pb-20': isMobileView && showMobileNav
        }
      ]"
    >
      <!-- Content goes here -->
    </main>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'

// Theme composable for theme-aware styling
const { backgroundColor, textColor } = useTheme()
</script>

<style>
/* Theme transitions */
.theme-transition,
.theme-transition * {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: ease;
  transition-duration: 0.2s;
}
</style>
```

## Theme Toggle UI

The application provides a theme toggle in its layouts:

```vue
<!-- Excerpt from AuthLayout.vue -->
<div class="flex justify-center py-3 border-t" :class="borderColor.default">
  <Button
    :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
    :label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
    class="p-button-text p-button-sm"
    @click="toggleTheme"
    style="height: auto; padding: 0.5rem 1rem;"
  />
</div>
```

## Benefits of the Theming System

1. **Consistency**: Unified theme across the entire application
2. **Flexibility**: Support for light mode, dark mode, and system preferences
3. **Developer Experience**: Helper composables and utilities
4. **Performance**: CSS variables and class-based approach for efficient rendering
5. **Integration**: Consistent theming across custom components and third-party libraries
6. **Accessibility**: Better support for user preferences and needs

## Conclusion

The IoT Platform's theming system represents a comprehensive approach to visual styling that respects user preferences while maintaining design consistency. By leveraging Vue.js reactivity, CSS variables, and Tailwind's dark mode utilities, the system provides a seamless experience across the application while remaining maintainable and extensible for developers.
