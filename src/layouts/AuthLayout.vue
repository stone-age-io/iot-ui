<!-- src/layouts/AuthLayout.vue -->
<template>
  <div :class="[
    'min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden',
    backgroundColor.primary
  ]">
    <div class="w-full max-w-md">
      <!-- Company Branding -->
      <div class="mb-8">
        <!-- Logo and Company Name -->
        <div class="flex justify-center mb-2">
          <div class="flex items-center">
            <div :class="['w-12 h-12 flex items-center justify-center mr-3', isDarkMode ? 'text-primary-400' : 'text-primary-600']">
              <!-- Custom SVG Logo -->
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="48" 
                height="48" 
                viewBox="0 0 256 256" 
                class="logo-image"
                aria-label="Company Logo"
              >
                <path 
                  d="M 128,0 C 57.343,0 0,57.343 0,128 C 0,198.657 57.343,256 128,256 C 198.657,256 256,198.657 256,128 C 256,57.343 198.657,0 128,0 z M 128,28 C 181.423,28 224.757,71.334 224.757,124.757 C 224.757,139.486 221.04,153.32 214.356,165.42 C 198.756,148.231 178.567,138.124 162.876,124.331 C 155.723,124.214 128.543,124.043 113.254,124.043 C 113.254,147.334 113.254,172.064 113.254,190.513 C 100.456,179.347 94.543,156.243 94.543,156.243 C 83.432,147.065 31.243,124.757 31.243,124.757 C 31.243,71.334 74.577,28 128,28 z" 
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h1 :class="['text-2xl sm:text-3xl font-bold whitespace-nowrap', isDarkMode ? 'text-primary-300' : 'text-primary-700']">Stone-Age.io</h1>
            </div>
          </div>
        </div>
        <!-- Tagline -->
        <p :class="['text-center', textColor.secondary]">Physical Access Control & Building Automation</p>
      </div>
      
      <!-- Auth Content Container -->
      <div :class="[
        'rounded-lg overflow-hidden',
        backgroundColor.surface,
        borderColor.default,
        shadowStyle.lg
      ]">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
        
        <!-- Theme Toggle - Now inside the card footer -->
        <div class="flex justify-center py-3 border-t" :class="borderColor.default">
          <Button
            :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
            :label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            class="p-button-text p-button-sm"
            @click="toggleTheme"
            style="height: auto; padding: 0.5rem 1rem;"
          />
        </div>
      </div>
      
      <!-- Footer -->
      <div class="text-center mt-6 text-sm" :class="textColor.secondary">
        &copy; {{ currentYear }} Stone-Age.io. All rights reserved.
      </div>
    </div>
    
    <!-- Notifications -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTheme } from '../composables/useTheme'
import Toast from 'primevue/toast'
import Button from 'primevue/button'

// Theme composable for theme-aware styling
const { 
  isDarkMode, 
  toggleTheme,
  backgroundColor, 
  textColor,
  borderColor,
  shadowStyle 
} = useTheme()

// Dynamic year for copyright
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.logo-image {
  fill: currentColor;
}

/* Ensure no overflow issues */
:deep(.p-button-label) {
  white-space: nowrap;
}

/* Fix for tooltips and prevent scrollbar flashes */
:deep(.p-tooltip) {
  max-width: 250px;
  overflow: hidden;
}
</style>
