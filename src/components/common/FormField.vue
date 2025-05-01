<!-- src/components/common/FormField.vue -->
<template>
  <div class="form-field-wrapper mb-4 theme-transition">
    <div class="flex justify-between items-start mb-1 flex-wrap">
      <label :for="id" class="block text-sm font-medium text-content-primary dark:text-content-primary-dark">
        {{ label }}
        <span v-if="required" class="text-red-500 dark:text-red-400">*</span>
      </label>
      <small v-if="hint" class="text-content-secondary dark:text-content-secondary-dark w-full sm:w-auto">{{ hint }}</small>
    </div>
    
    <slot></slot>
    
    <small class="p-error block mt-1" v-if="errorMessage">
      {{ errorMessage }}
    </small>
    
    <small v-if="helpText" class="text-content-secondary dark:text-content-secondary-dark mt-1 block">
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
});
</script>

<style>
/* Specific error styling for dark mode */
:deep(.p-error) {
  @apply dark:text-red-400;
}

/* Ensure form fields have appropriate focus styles in both themes */
:deep(input:focus),
:deep(textarea:focus),
:deep(select:focus) {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
  @apply dark:ring-primary-400 dark:ring-offset-gray-800;
}
</style>
