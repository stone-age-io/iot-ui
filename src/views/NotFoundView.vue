<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-surface-primary dark:bg-surface-primary-dark theme-transition">
    <div class="text-center max-w-md">
      <div class="text-7xl font-bold mb-4 text-primary-600 dark:text-primary-400">404</div>
      <h1 class="text-3xl font-bold mb-2 text-content-primary dark:text-content-primary-dark">Page Not Found</h1>
      <p class="mb-6 text-content-secondary dark:text-content-secondary-dark">The page you're looking for doesn't exist or has been moved.</p>
      
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

// Only use what we need from the theme composable
const { isDarkMode, toggleTheme } = useTheme()
</script>
