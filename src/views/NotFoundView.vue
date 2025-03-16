<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="text-center">
      <div class="text-primary-600 text-7xl font-bold mb-4">404</div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p class="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <Button
        label="Back to Dashboard"
        icon="pi pi-home"
        @click="$router.push('/')"
      />
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
</script>
