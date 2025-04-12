<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">{{ title }}</h1>
      <p v-if="subtitle" class="text-gray-600 mt-1 dark:text-gray-400">{{ subtitle }}</p>
    </div>
    
    <div class="mt-2 sm:mt-0">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>
