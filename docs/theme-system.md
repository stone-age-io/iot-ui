# Tailwind-First Theming System

## Overview

The Stone-Age.io IoT Platform implements a Tailwind-first theming system that supports light and dark modes, system preference detection, and consistent styling across both custom components and third-party libraries like PrimeVue. The system leverages Tailwind's dark mode, custom theme color utilities, and CSS variables for a maintainable and visually cohesive experience.

## Theming Architecture

The theming system consists of several interconnected components:

1. **Theme Store**: Centralized Pinia store for theme state management
2. **Tailwind Configuration**: Custom theme colors and dark mode setup
3. **CSS Variables**: Theme values in CSS custom properties
4. **PrimeVue Integration**: Custom theming for the UI component library
5. **Direct Utility Classes**: Consistent class naming conventions for theming

## Theme Store (Pinia)

The theme store manages the application's theme state:

```javascript
// src/stores/theme.js
export const useThemeStore = defineStore('theme', () => {
  // State - default to 'auto' which follows system preference
  const theme = ref(localStorage.getItem('theme') || 'auto')
  
  /**
   * Set the application theme and persist the preference
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
   * Apply the selected theme to the document
   */
  function applyTheme(selectedTheme) {
    const isDark = selectedTheme === 'dark' || 
      (selectedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    // Update document class for Tailwind dark mode
    document.documentElement.classList.toggle('dark', isDark)
  }
  
  /**
   * Check if dark mode is currently active
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
    
    // Add event listener for system theme changes
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
```

## Tailwind Configuration

The application defines theme colors and dark mode in the Tailwind configuration:

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': {
          '50': '#f0f9ff',
          '100': '#e0f2fe',
          '200': '#bae6fd',
          '300': '#7dd3fc',
          '400': '#38bdf8',
          '500': '#0ea5e9',
          '600': '#0284c7',
          '700': '#0369a1',
          '800': '#075985',
          '900': '#0c4a6e',
          '950': '#082f49',
        },
        'surface': {
          'primary': '#ffffff',
          'primary-dark': '#1f2937',
          'hover': '#f3f3f6',
          'hover-dark': '#374151',
          'secondary': '#f9fafb',
          'secondary-dark': '#111827',
          'tertiary': '#f3f4f6',
          'tertiary-dark': '#374151'
        },
        'content': {
          'primary': '#111827',
          'primary-dark': '#f9fafb',
          'secondary': '#4b5563',
          'secondary-dark': '#9ca3af'
        },
        'border': {
          'primary': '#e5e7eb',
          'primary-dark': '#4b5563',
          'secondary': '#f3f4f6',
          'secondary-dark': '#374151'
        }
      },
      boxShadow: {
        'theme-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'theme-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'theme-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'theme-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }
    },
  },
  plugins: [],
}
```

## CSS Styles & Variables

The application defines global styles and theme transitions:

```css
/* src/assets/styles/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Theme transition for smooth color changes */
.theme-transition {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: ease;
  transition-duration: 0.2s;
}

/* Common element styling based on theme */
@layer base {
  body {
    @apply bg-surface-primary dark:bg-surface-primary-dark text-content-primary dark:text-content-primary-dark;
    min-height: 100vh;
    -webkit-tap-highlight-color: transparent;
  }

  #app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
}

/* Component styling using Tailwind classes */
@layer components {
  .card {
    @apply bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-sm theme-transition p-5 mb-5;
  }

  .page-header {
    @apply text-xl font-bold text-content-primary dark:text-content-primary-dark mb-5;
  }

  /* Other component styles... */
}

/* Additional utilities */
@layer utilities {
  .dark-mode-hidden {
    @apply block dark:hidden;
  }
  
  .light-mode-hidden {
    @apply hidden dark:block;
  }
  
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-900;
  }
}
```

## PrimeVue Theme Integration

The application integrates with PrimeVue using a dedicated CSS file:

```css
/* src/assets/styles/primevue-theme.css */

/* PrimeVue CSS variable mappings for theme consistency */
:root {
  /* Light theme PrimeVue variables */
  --primary-color: #3B82F6;
  --primary-color-hover: #2563EB;
  --text-color: rgb(17, 24, 39);
  --text-color-secondary: rgb(107, 114, 128);
  --surface-a: rgb(255, 255, 255);
  --surface-b: rgb(249, 250, 251);
  --surface-c: rgb(229, 231, 235 / 30%);
  --surface-d: rgb(229, 231, 235);
  --surface-e: rgb(255, 255, 255);
  --surface-f: rgb(255, 255, 255);
  --surface-hover: rgb(243, 244, 246);
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #3B82F6;
}

/* Dark theme PrimeVue variables */
.dark {
  --primary-color: #60A5FA;
  --primary-color-hover: #3B82F6;
  --text-color: rgb(243, 244, 246);
  --text-color-secondary: rgb(156, 163, 175);
  --surface-a: rgb(42, 42, 60);
  --surface-b: rgb(30, 41, 59);
  --surface-c: rgb(75, 85, 99 / 30%);
  --surface-d: rgb(75, 85, 99);
  --surface-e: rgb(42, 42, 60);
  --surface-f: rgb(42, 42, 60);
  --surface-hover: rgb(55, 65, 81);
  --focus-ring: 0 0 0 2px rgb(30, 41, 59), 0 0 0 4px rgb(96, 165, 250);
}

/* PrimeVue component styling overrides */
/* Button, Form controls, DataTable, etc. styling here... */
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

## Using the Tailwind-First Theme System in Components

Components use the theming system by applying Tailwind utility classes directly:

### Page Container with Theme Support

```vue
<template>
  <div class="min-h-screen flex flex-col bg-surface-primary dark:bg-surface-primary-dark text-content-primary dark:text-content-primary-dark theme-transition">
    <!-- Content goes here -->
  </div>
</template>
```

### Cards and UI Elements

```vue
<template>
  <!-- Card with proper theming -->
  <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
    <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
      <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Card Title</h2>
    </div>
    <div class="p-6">
      <p class="text-content-secondary dark:text-content-secondary-dark">Card content...</p>
    </div>
  </div>
</template>
```

### Forms and Inputs

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Input Field -->
    <div class="form-field">
      <label class="block mb-1 text-content-primary dark:text-content-primary-dark">Field Label</label>
      <input 
        type="text" 
        class="w-full rounded-md border border-border-primary dark:border-border-primary-dark bg-surface-primary dark:bg-surface-secondary-dark text-content-primary dark:text-content-primary-dark" 
      />
    </div>
    
    <!-- Button -->
    <button class="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-md px-4 py-2">
      Submit
    </button>
  </div>
</template>
```

### Dynamic Status Indicators

```vue
<template>
  <!-- Status Badge -->
  <span 
    :class="[
      'px-2 py-1 text-xs rounded-full font-medium inline-block',
      active ? 
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    ]"
  >
    {{ active ? 'Active' : 'Inactive' }}
  </span>
</template>

<script setup>
// The active state could come from props or local state
const active = ref(true)
</script>
```

### Theme Toggle Button

```vue
<template>
  <button 
    @click="toggleTheme" 
    class="p-2 rounded-md text-content-primary dark:text-content-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark"
  >
    <i v-if="isDarkMode" class="pi pi-sun"></i>
    <i v-else class="pi pi-moon"></i>
    <span class="ml-2">{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</span>
  </button>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

// Detect if dark mode is currently active
const isDarkMode = computed(() => themeStore.isDarkModeActive())

// Toggle between light and dark modes
function toggleTheme() {
  const newTheme = isDarkMode.value ? 'light' : 'dark'
  themeStore.setTheme(newTheme)
}
</script>
```

## Benefits of the Tailwind-First Theming System

1. **Consistency**: Unified theme using Tailwind's utility classes
2. **Explicit Classes**: Direct use of semantic utility classes for better readability
3. **Developer Experience**: Less abstraction, more intuitive class names
4. **Performance**: Optimized CSS through Tailwind's build process
5. **Flexibility**: Support for light mode, dark mode, and system preferences
6. **Maintainability**: Direct mapping between classes and visual appearance

## Theming Convention Guidelines

When implementing the theming system, follow these conventions:

### 1. Core Color Classes

Use semantic color classes for each theme component:

- **Backgrounds**: `bg-surface-primary dark:bg-surface-primary-dark`
- **Text**: `text-content-primary dark:text-content-primary-dark`
- **Borders**: `border-border-primary dark:border-border-primary-dark`
- **Shadows**: `shadow-theme-sm`, `shadow-theme-md`, etc.

### 2. Theme Transitions

Add smooth transitions with: `theme-transition`

### 3. UI Components Pattern

For cards and panels:

```html
<div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
  <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
    <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Title</h2>
  </div>
  <div class="p-6">
    <!-- Content here -->
  </div>
</div>
```

### 4. Text Hierarchy

- Primary text: `text-content-primary dark:text-content-primary-dark`
- Secondary text: `text-content-secondary dark:text-content-secondary-dark`

### 5. Form Elements

Consistent styling for form elements:

```html
<input class="border border-border-primary dark:border-border-primary-dark bg-surface-primary dark:bg-surface-secondary-dark text-content-primary dark:text-content-primary-dark rounded-md p-2" />
```

## Conclusion

The Tailwind-first theming system provides a direct and explicit approach to consistent styling across the application. By leveraging Tailwind's utility classes with semantic naming conventions, the system ensures visual consistency while remaining accessible and maintainable. Dark mode support is seamlessly integrated through Tailwind's dark variant, providing an optimal experience for all users regardless of their preference.
