<!-- src/components/common/FormField.vue -->
<template>
  <div class="form-field-wrapper mb-4">
    <div class="flex justify-between items-start mb-1 flex-wrap">
      <label :for="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
        <span v-if="required" class="text-red-500 dark:text-red-400">*</span>
      </label>
      <small v-if="hint" class="text-gray-500 dark:text-gray-400 w-full sm:w-auto">{{ hint }}</small>
    </div>
    
    <slot></slot>
    
    <small class="p-error block mt-1" v-if="errorMessage">
      {{ errorMessage }}
    </small>
    
    <small v-if="helpText" class="text-gray-500 dark:text-gray-400 mt-1 block">
      {{ helpText }}
    </small>
  </div>
</template>

<script setup>
defineProps({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  hint: {
    type: String,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
/* Using CSS variables from our theming system */
.form-field-wrapper label {
  color: rgb(var(--color-text));
}

.form-field-wrapper small {
  color: rgb(var(--color-text-secondary));
}

/* The p-error class is styled by PrimeVue, but we can add custom styling if needed */
</style>
