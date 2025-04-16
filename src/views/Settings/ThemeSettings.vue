<template>
  <div class="theme-settings">
    <p :class="['mb-4', textColor.secondary]">
      Choose how the application looks. You can select light mode, dark mode, or follow your system settings.
    </p>
    
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Light Theme Option -->
      <div 
        :class="[
          'rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md', 
          theme === 'light' 
            ? themeValue.class('border-primary-500 bg-primary-50', 'border-primary-700 bg-primary-900/20') 
            : borderColor.default + ' ' + backgroundColor.secondary,
          theme === 'light' ? 'border-2' : 'border'
        ]"
        @click="setTheme('light')"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <i :class="['pi pi-sun mr-2', themeValue.class('text-primary-600', 'text-primary-400')]"></i>
            <span :class="[textColor.primary, 'font-medium']">Light</span>
          </div>
          <i v-if="theme === 'light'" class="pi pi-check text-primary-600 dark:text-primary-400"></i>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="bg-white border border-gray-200 rounded-md h-16 flex items-center justify-center text-xs text-gray-400">
            Light mode preview
          </div>
          <p :class="['text-xs', textColor.secondary]">Light backgrounds with dark text</p>
        </div>
      </div>
      
      <!-- Dark Theme Option -->
      <div 
        :class="[
          'rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md', 
          theme === 'dark' 
            ? themeValue.class('border-primary-500 bg-primary-50', 'border-primary-700 bg-primary-900/20') 
            : borderColor.default + ' ' + backgroundColor.secondary,
          theme === 'dark' ? 'border-2' : 'border'
        ]"
        @click="setTheme('dark')"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <i :class="['pi pi-moon mr-2', themeValue.class('text-primary-600', 'text-primary-400')]"></i>
            <span :class="[textColor.primary, 'font-medium']">Dark</span>
          </div>
          <i v-if="theme === 'dark'" class="pi pi-check text-primary-600 dark:text-primary-400"></i>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="bg-gray-900 border border-gray-700 rounded-md h-16 flex items-center justify-center text-xs text-gray-400">
            Dark mode preview
          </div>
          <p :class="['text-xs', textColor.secondary]">Dark backgrounds with light text</p>
        </div>
      </div>
      
      <!-- System Theme Option -->
      <div 
        :class="[
          'rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md', 
          theme === 'auto' 
            ? themeValue.class('border-primary-500 bg-primary-50', 'border-primary-700 bg-primary-900/20') 
            : borderColor.default + ' ' + backgroundColor.secondary,
          theme === 'auto' ? 'border-2' : 'border'
        ]"
        @click="setTheme('auto')"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <i :class="['pi pi-desktop mr-2', themeValue.class('text-primary-600', 'text-primary-400')]"></i>
            <span :class="[textColor.primary, 'font-medium']">System</span>
          </div>
          <i v-if="theme === 'auto'" class="pi pi-check text-primary-600 dark:text-primary-400"></i>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="bg-gradient-to-r from-white to-gray-900 border border-gray-200 dark:border-gray-700 rounded-md h-16 flex items-center justify-center text-xs text-gray-600">
            System default
          </div>
          <p :class="['text-xs', textColor.secondary]">Follows your device theme settings</p>
        </div>
      </div>
    </div>
    
    <!-- Current System Status -->
    <div :class="['flex items-center mt-6 p-3 rounded-lg text-sm', backgroundColor.secondary, borderColor.light]">
      <i class="pi pi-info-circle mr-2 text-blue-500 dark:text-blue-400"></i>
      <span>
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
import { useTheme } from '../../composables/useTheme';

// Theme store for changing theme
const themeStore = useThemeStore();
const theme = computed(() => themeStore.theme);
const setTheme = (newTheme) => themeStore.setTheme(newTheme);

// Theme composable for theme-aware styling
const { themeValue, textColor, backgroundColor, borderColor } = useTheme();

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
