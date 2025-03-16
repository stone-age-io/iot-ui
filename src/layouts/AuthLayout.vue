<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary-700">IoT Platform</h1>
        <p class="text-gray-600 mt-2">Physical Access Control & Building Automation</p>
      </div>
      
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      
      <div class="text-center mt-6 text-sm text-gray-500">
        &copy; {{ currentYear }} Your Organization. All rights reserved.
      </div>
    </div>
    
    <!-- Notifications -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Toast from 'primevue/toast'

const currentYear = ref(new Date().getFullYear())
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
</style>
