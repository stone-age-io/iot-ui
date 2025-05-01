<!-- src/views/Settings/ThemeSettings.vue -->
<template>
  <div class="theme-settings">
    <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">
      Choose how the application looks. You can select light mode, dark mode, or follow your system settings.
    </p>
    
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Light Theme Option -->
      <div 
        :class="[
          'rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md theme-transition', 
          theme === 'light' 
            ? 'border-primary-500 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 border-2' 
            : 'border-border-primary dark:border-border-primary-dark bg-surface-secondary dark:bg-surface-secondary-dark border'
        ]"
        @click="setTheme('light')"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <i class="pi pi-sun mr-2 text-primary-600 dark:text-primary-400"></i>
            <span class="font-medium text-content-primary dark:text-content-primary-dark">Light</span>
          </div>
          <i v-if="theme === 'light'" class="pi pi-check text-primary-600 dark:text-primary-400"></i>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="bg-white border border-gray-200 rounded-md h-16 flex items-center justify-center text-xs text-gray-400">
            Light mode preview
          </div>
          <p class="text-xs text-content-secondary dark:text-content-secondary-dark">Light backgrounds with dark text</p>
        </div>
      </div>
      
      <!-- Dark Theme Option -->
      <div 
        :class="[
          'rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md theme-transition', 
          theme === 'dark' 
            ? 'border-primary-500 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 border-2' 
            : 'border-border-primary dark:border-border-primary-dark bg-surface-secondary dark:bg-surface-secondary-dark border'
        ]"
        @click="setTheme('dark')"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <i class="pi pi-moon mr-2 text-primary-600 dark:text-primary-400"></i>
            <span class="font-medium text-content-primary dark:text-content-primary-dark">Dark</span>
          </div>
          <i v-if="theme === 'dark'" class="pi pi-check text-primary-600 dark:text-primary-400"></i>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="bg-gray-900 border border-gray-700 rounded-md h-16 flex items-center justify-center text-xs text-gray-400">
            Dark mode preview
          </div>
          <p class="text-xs text-content-secondary dark:text-content-secondary-dark">Dark backgrounds with light text</p>
        </div>
      </div>
      
      <!-- System Theme Option -->
      <div 
        :class="[
          'rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md theme-transition', 
          theme === 'auto' 
            ? 'border-primary-500 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 border-2' 
            : 'border-border-primary dark:border-border-primary-dark bg-surface-secondary dark:bg-surface-secondary-dark border'
        ]"
        @click="setTheme('auto')"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <i class="pi pi-desktop mr-2 text-primary-600 dark:text-primary-400"></i>
            <span class="font-medium text-content-primary dark:text-content-primary-dark">System</span>
          </div>
          <i v-if="theme === 'auto'" class="pi pi-check text-primary-600 dark:text-primary-400"></i>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="bg-gradient-to-r from-white to-gray-900 border border-gray-200 dark:border-gray-700 rounded-md h-16 flex items-center justify-center text-xs text-gray-600">
            System default
          </div>
          <p class="text-xs text-content-secondary dark:text-content-secondary-dark">Follows your device theme settings</p>
        </div>
      </div>
    </div>
    
    <!-- Current System Status -->
    <div class="flex items-center mt-6 p-3 rounded-lg text-sm bg-surface-secondary dark:bg-surface-secondary-dark border border-border-light dark:border-border-light-dark">
      <i class="pi pi-info-circle mr-2 text-blue-500 dark:text-blue-400"></i>
      <span class="text-content-primary dark:text-content-primary-dark">
        Your system is currently using 
        <span class="font-medium">{{ systemPreference }}</span> mode.
        {{ theme === 'auto' ? 'The application will follow this setting.' : '' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useThemeStore } from '../../stores/theme';

// Theme store for changing theme
const themeStore = useThemeStore();
const theme = computed(() => themeStore.theme);
const setTheme = (newTheme) => themeStore.setTheme(newTheme);

// Track system preference for display
const systemThemeDark = ref(false);
const mediaQuery = ref(null);

// Compute a readable description of the system preference
const systemPreference = computed(() => {
  return systemThemeDark.value ? 'dark' : 'light';
});

// Handle system theme changes
const handleSystemThemeChange = (e) => {
  systemThemeDark.value = e.matches;
};

onMounted(() => {
  // Initialize system preference detection
  mediaQuery.value = window.matchMedia('(prefers-color-scheme: dark)');
  systemThemeDark.value = mediaQuery.value.matches;
  
  // Add listener for system theme changes
  mediaQuery.value.addEventListener('change', handleSystemThemeChange);
});

onUnmounted(() => {
  // Remove event listener when component is destroyed
  if (mediaQuery.value) {
    mediaQuery.value.removeEventListener('change', handleSystemThemeChange);
  }
});
</script>

<style scoped>
/* Smoother transition when switching themes */
.theme-settings {
  transition: background-color 0.2s ease, color 0.2s ease;
}
</style>
