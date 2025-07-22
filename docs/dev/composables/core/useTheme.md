# useTheme

## Overview

The `useTheme` composable provides reactive theme management with system preference detection and automatic theme switching capabilities. It integrates with the application's theme store and provides utilities for theme-aware component development.

## Location

```
src/composables/useTheme.js
```

## Purpose

- **Theme State Management**: Reactive access to current theme settings
- **System Preference Detection**: Automatic detection of system dark/light mode preference
- **Theme Switching**: Methods to change between light, dark, and auto themes
- **Reactive Updates**: Automatic UI updates when theme changes
- **CSS Class Management**: Automatic application of theme-related CSS classes

## Dependencies

```javascript
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
```

## Returns

```javascript
{
  currentTheme: ComputedRef<string>,
  isDarkMode: ComputedRef<boolean>,
  systemPrefersDark: Ref<boolean>,
  setLightTheme: Function,
  setDarkTheme: Function,
  setSystemTheme: Function,
  toggleTheme: Function
}
```

---

## Properties

### currentTheme

Computed reference to the current theme setting.

**Type:** `ComputedRef<string>`

**Values:** `'light' | 'dark' | 'auto'`

**Description:** Returns the current theme setting from the theme store. The 'auto' setting means the theme follows system preference.

### isDarkMode

Computed reference indicating if dark mode is currently active.

**Type:** `ComputedRef<boolean>`

**Description:** Returns true when dark mode should be applied, considering both explicit theme setting and system preference for 'auto' mode.

```javascript
// Logic for isDarkMode
const isDarkMode = computed(() => {
  return themeStore.theme === 'dark' || 
    (themeStore.theme === 'auto' && systemPrefersDark.value)
})
```

### systemPrefersDark

Reactive reference to the system's dark mode preference.

**Type:** `Ref<boolean>`

**Description:** Tracks the system's color scheme preference using the `prefers-color-scheme: dark` media query. Automatically updates when system preference changes.

---

## Methods

### setLightTheme()

Sets the theme to light mode.

**Returns:** `void`

**Usage:**

```javascript
const { setLightTheme } = useTheme()

// Force light theme
setLightTheme()
```

### setDarkTheme()

Sets the theme to dark mode.

**Returns:** `void`

**Usage:**

```javascript
const { setDarkTheme } = useTheme()

// Force dark theme
setDarkTheme()
```

### setSystemTheme()

Sets the theme to follow system preference.

**Returns:** `void`

**Usage:**

```javascript
const { setSystemTheme } = useTheme()

// Follow system preference
setSystemTheme()
```

### toggleTheme()

Cycles through available themes in order: light → dark → auto → light.

**Returns:** `void`

**Usage:**

```javascript
const { toggleTheme } = useTheme()

// Toggle between themes
toggleTheme()
```

---

## Usage Examples

### Basic Theme Management

```javascript
import { useTheme } from '@/composables/useTheme'

export default {
  setup() {
    const { 
      currentTheme,
      isDarkMode,
      toggleTheme,
      setDarkTheme
    } = useTheme()
    
    return {
      currentTheme,
      isDarkMode,
      toggleTheme,
      setDarkTheme
    }
  }
}
```

### Theme-Aware Styling

```vue
<template>
  <div :class="containerClasses">
    <Button 
      @click="toggleTheme"
      :class="buttonClasses"
      :icon="themeIcon"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { isDarkMode, currentTheme, toggleTheme } = useTheme()

const containerClasses = computed(() => ({
  'bg-gray-100 text-gray-900': !isDarkMode.value,
  'bg-gray-900 text-gray-100': isDarkMode.value,
  'border-gray-300': !isDarkMode.value,
  'border-gray-700': isDarkMode.value
}))

const buttonClasses = computed(() => ({
  'btn-light': !isDarkMode.value,
  'btn-dark': isDarkMode.value
}))

const themeIcon = computed(() => {
  switch (currentTheme.value) {
    case 'light': return 'pi pi-sun'
    case 'dark': return 'pi pi-moon'
    case 'auto': return 'pi pi-desktop'
    default: return 'pi pi-sun'
  }
})
</script>
```

### Theme Persistence

```javascript
// Theme settings are automatically persisted via the theme store
export function useTheme() {
  const themeStore = useThemeStore()
  
  // Theme changes are automatically saved to localStorage
  const setDarkTheme = () => {
    themeStore.setTheme('dark') // Persisted automatically
  }
  
  return { setDarkTheme }
}
```

### Conditional Rendering

```vue
<template>
  <div>
    <!-- Light theme specific content -->
    <LightThemeHeader v-if="!isDarkMode" />
    
    <!-- Dark theme specific content -->
    <DarkThemeHeader v-else />
    
    <!-- Theme-aware icons -->
    <Icon 
      :name="isDarkMode ? 'moon' : 'sun'" 
      :class="isDarkMode ? 'text-yellow-400' : 'text-blue-500'"
    />
  </div>
</template>

<script setup>
import { useTheme } from '@/composables/useTheme'

const { isDarkMode } = useTheme()
</script>
```

---

## System Integration

### Automatic CSS Class Application

The composable automatically applies theme classes to the document root:

```javascript
// Watches isDarkMode and applies classes
watch(isDarkMode, (newIsDark) => {
  document.documentElement.classList.toggle('dark', newIsDark)
}, { immediate: true })
```

### Media Query Listening

The composable listens for system preference changes:

```javascript
onMounted(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const updateSystemPreference = (e) => {
    systemPrefersDark.value = e.matches
  }
  
  // Modern API
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', updateSystemPreference)
  } 
  // Legacy API for older browsers
  else if (mediaQuery.addListener) {
    mediaQuery.addListener(updateSystemPreference)
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', updateSystemPreference)
    } else if (mediaQuery.removeListener) {
      mediaQuery.removeListener(updateSystemPreference)
    }
  })
})
```

### Custom Events

The composable dispatches custom events for theme changes:

```javascript
// Theme change events
window.addEventListener('theme-changed', () => {
  // Handle theme change in other parts of the app
})

window.addEventListener('system-theme-changed', (e) => {
  // Handle system theme change
  console.log('System theme changed:', e.detail.isDark)
})
```

---

## Integration with UI Components

### PrimeVue Integration

```vue
<script setup>
import { watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { usePrimeVue } from 'primevue/config'

const { isDarkMode } = useTheme()
const primevue = usePrimeVue()

// Update PrimeVue theme when app theme changes
watch(isDarkMode, (dark) => {
  const theme = dark ? 'lara-dark-blue' : 'lara-light-blue'
  primevue.changeTheme('current-theme', theme, 'theme-link')
}, { immediate: true })
</script>
```

### Tailwind CSS Integration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: ['./src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware color variables
        primary: {
          light: '#3b82f6',
          dark: '#60a5fa'
        }
      }
    }
  }
}
```

```vue
<template>
  <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Content automatically adapts to theme -->
  </div>
</template>
```

### Custom CSS Properties

```css
/* Define CSS custom properties for themes */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1f2937;
  --border-color: #e5e7eb;
}

:root.dark {
  --bg-primary: #1f2937;
  --text-primary: #f9fafb;
  --border-color: #374151;
}

.themed-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}
```

---

## Advanced Usage

### Theme-Aware Chart Colors

```javascript
import { useTheme } from '@/composables/useTheme'

export function useChartTheme() {
  const { isDarkMode } = useTheme()
  
  const chartColors = computed(() => {
    if (isDarkMode.value) {
      return {
        primary: '#60a5fa',
        secondary: '#34d399',
        background: '#1f2937',
        text: '#f9fafb',
        grid: '#374151'
      }
    } else {
      return {
        primary: '#3b82f6',
        secondary: '#10b981',
        background: '#ffffff',
        text: '#1f2937',
        grid: '#e5e7eb'
      }
    }
  })
  
  return { chartColors }
}
```

### Theme Transition Animation

```css
/* Smooth theme transitions */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* Disable transitions during theme change to prevent flashing */
.theme-transitioning * {
  transition: none !important;
}
```

```javascript
const toggleTheme = () => {
  // Add transition class
  document.documentElement.classList.add('theme-transitioning')
  
  // Change theme
  themeStore.setTheme(nextTheme)
  
  // Remove transition class after change
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('theme-transitioning')
  })
}
```

### Responsive Theme Settings

```javascript
export function useResponsiveTheme() {
  const { currentTheme, setLightTheme, setDarkTheme } = useTheme()
  
  // Auto-adjust theme based on time of day
  const autoAdjustTheme = () => {
    const hour = new Date().getHours()
    const isDayTime = hour >= 6 && hour < 18
    
    if (currentTheme.value === 'auto') {
      if (isDayTime) {
        setLightTheme()
      } else {
        setDarkTheme()
      }
    }
  }
  
  // Check every hour
  const intervalId = setInterval(autoAdjustTheme, 60 * 60 * 1000)
  
  onUnmounted(() => {
    clearInterval(intervalId)
  })
  
  return { autoAdjustTheme }
}
```

---

## Best Practices

### 1. Use Computed Properties for Theme-Dependent Values

```javascript
// ✅ Good - reactive to theme changes
const iconClass = computed(() => ({
  'text-blue-600': !isDarkMode.value,
  'text-blue-400': isDarkMode.value
}))

// ❌ Avoid - not reactive
const iconClass = isDarkMode.value ? 'text-blue-400' : 'text-blue-600'
```

### 2. Leverage CSS Classes Over Inline Styles

```vue
<!-- ✅ Good - uses CSS classes -->
<div :class="containerClasses">Content</div>

<!-- ❌ Avoid - inline styles -->
<div :style="{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }">
  Content
</div>
```

### 3. Provide Theme Toggle UI

```vue
<template>
  <ToggleButton
    v-model="isDarkMode"
    @change="toggleTheme"
    onLabel="Dark"
    offLabel="Light"
    onIcon="pi pi-moon"
    offIcon="pi pi-sun"
  />
</template>
```

### 4. Test Both Themes

```javascript
// ✅ Good - test theme variations
describe('Component theming', () => {
  it('should render correctly in light theme', () => {
    const { setLightTheme } = useTheme()
    setLightTheme()
    // Test light theme rendering
  })
  
  it('should render correctly in dark theme', () => {
    const { setDarkTheme } = useTheme()
    setDarkTheme()
    // Test dark theme rendering
  })
})
```

### 5. Consider Accessibility

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}

/* Ensure sufficient contrast in both themes */
.text-primary {
  color: var(--text-primary);
  /* Ensure minimum 4.5:1 contrast ratio */
}
```

---

## Testing

### Unit Testing

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTheme } from '@/composables/useTheme'

describe('useTheme', () => {
  let mockThemeStore
  
  beforeEach(() => {
    mockThemeStore = {
      theme: 'light',
      setTheme: vi.fn()
    }
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    })
  })
  
  it('should return current theme state', () => {
    const { currentTheme, isDarkMode } = useTheme()
    
    expect(currentTheme.value).toBe('light')
    expect(isDarkMode.value).toBe(false)
  })
  
  it('should toggle theme correctly', () => {
    const { toggleTheme } = useTheme()
    
    toggleTheme()
    
    expect(mockThemeStore.setTheme).toHaveBeenCalledWith('dark')
  })
  
  it('should detect system preference', () => {
    // Mock dark system preference
    window.matchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })
    
    const { systemPrefersDark } = useTheme()
    
    expect(systemPrefersDark.value).toBe(true)
  })
})
```

### Integration Testing

```javascript
describe('Theme integration', () => {
  it('should apply dark class to document when in dark mode', async () => {
    const { setDarkTheme } = useTheme()
    
    setDarkTheme()
    await nextTick()
    
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
```

The `useTheme` composable provides a comprehensive solution for theme management, making it easy to build applications that respect user preferences and provide consistent theming across all components.
