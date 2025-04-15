<template>
  <div :class="['min-h-screen flex items-center justify-center px-4', backgroundColor.primary]">
    <div class="text-center max-w-md">
      <div :class="['text-7xl font-bold mb-4', isDarkMode ? 'text-primary-400' : 'text-primary-600']">404</div>
      <h1 :class="['text-3xl font-bold mb-2', textColor.primary]">Page Not Found</h1>
      <p :class="['mb-6', textColor.secondary]">The page you're looking for doesn't exist or has been moved.</p>
      
      <div class="flex gap-3 justify-center">
        <Button
          label="Back to Dashboard"
          icon="pi pi-home"
          @click="$router.push('/')"
        />
        <Button
          label="Go Back"
          icon="pi pi-arrow-left"
          class="p-button-outlined"
          @click="$router.back()"
        />
      </div>
      
      <!-- Theme Toggle -->
      <div class="mt-8 flex justify-center">
        <Button
          :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
          :label="isDarkMode ? 'Light Mode' : 'Dark Mode'"
          class="p-button-text p-button-sm"
          @click="toggleTheme"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'
import Button from 'primevue/button'

// Theme composable for theme-aware styling
const { 
  isDarkMode,
  toggleTheme,
  backgroundColor, 
  textColor,
  borderColor 
} = useTheme()
</script>
