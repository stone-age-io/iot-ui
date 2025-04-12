<!-- src/layouts/AuthLayout.vue -->
<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-8 dark:bg-gray-900">
    <div class="w-full max-w-md">
      <!-- Company Branding -->
      <div class="mb-8">
        <!-- Logo and Company Name -->
        <div class="flex justify-center mb-2">
          <div class="flex items-center">
            <div class="text-primary-600 w-12 h-12 flex items-center justify-center mr-3">
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
              <h1 class="text-2xl sm:text-3xl font-bold text-primary-700 whitespace-nowrap dark:text-primary-300">Stone-Age.io</h1>
            </div>
          </div>
        </div>
        <!-- Tagline -->
        <p class="text-gray-600 text-center dark:text-gray-400">Physical Access Control & Building Automation</p>
      </div>
      
      <!-- Auth Content Container -->
      <div class="bg-[#1f4b8e] shadow-lg rounded-lg overflow-hidden">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      
      <!-- Footer -->
      <div class="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
        &copy; {{ currentYear }} Stone-Age.io. All rights reserved.
      </div>
    </div>
    
    <!-- Notifications -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Toast from 'primevue/toast'

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
  fill: var(--primary-color);
}
</style>
