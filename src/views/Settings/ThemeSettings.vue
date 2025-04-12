<!-- src/views/Settings/ThemeSettings.vue -->
<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Theme Settings</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Light Theme Option -->
      <div 
        class="border rounded-lg p-4 cursor-pointer"
        :class="{'border-primary-500 bg-primary-50 dark:bg-primary-900/20': theme === 'light'}"
        @click="setTheme('light')"
      >
        <div class="flex items-center mb-2">
          <i class="pi pi-sun mr-2"></i>
          <span>Light</span>
          <i v-if="theme === 'light'" class="pi pi-check ml-auto text-primary-600"></i>
        </div>
        <div class="bg-white border rounded p-2"></div>
      </div>
      
      <!-- Dark Theme Option -->
      <div 
        class="border rounded-lg p-4 cursor-pointer"
        :class="{'border-primary-500 bg-primary-50 dark:bg-primary-900/20': theme === 'dark'}"
        @click="setTheme('dark')"
      >
        <div class="flex items-center mb-2">
          <i class="pi pi-moon mr-2"></i>
          <span>Dark</span>
          <i v-if="theme === 'dark'" class="pi pi-check ml-auto text-primary-600"></i>
        </div>
        <div class="bg-gray-900 border rounded p-2"></div>
      </div>
      
      <!-- System Theme Option -->
      <div 
        class="border rounded-lg p-4 cursor-pointer"
        :class="{'border-primary-500 bg-primary-50 dark:bg-primary-900/20': theme === 'auto'}"
        @click="setTheme('auto')"
      >
        <div class="flex items-center mb-2">
          <i class="pi pi-desktop mr-2"></i>
          <span>System</span>
          <i v-if="theme === 'auto'" class="pi pi-check ml-auto text-primary-600"></i>
        </div>
        <div class="bg-gradient-to-r from-white to-gray-900 rounded border p-2"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../../stores/theme'

const themeStore = useThemeStore()
const theme = computed(() => themeStore.theme)
const setTheme = (newTheme) => themeStore.setTheme(newTheme)
</script>
