<!-- src/components/common/Card.vue -->
<template>
  <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg p-5
              border border-border-primary dark:border-border-primary-dark
              shadow-theme-lg theme-transition">
    <h2 v-if="title" class="text-content-primary dark:text-content-primary-dark text-lg font-semibold mb-4">
      {{ title }}
    </h2>
    <div class="text-content-secondary dark:text-content-secondary-dark">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  }
});
</script>
