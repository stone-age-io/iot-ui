<template>
  <div class="form-field-wrapper mb-4">
    <div class="flex justify-between items-start mb-1 flex-wrap">
      <label :for="id" class="block text-sm font-medium text-theme-primary dark:text-gray-300">
        {{ label }}
        <span v-if="required" class="text-red-500 dark:text-red-400">*</span>
      </label>
      <small v-if="hint" class="text-theme-secondary dark:text-gray-400 w-full sm:w-auto">{{ hint }}</small>
    </div>
    
    <slot></slot>
    
    <small class="p-error block mt-1" v-if="errorMessage">
      {{ errorMessage }}
    </small>
    
    <small v-if="helpText" class="text-theme-secondary dark:text-gray-400 mt-1 block">
      {{ helpText }}
    </small>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useThemeStore } from '../../stores/theme';

const props = defineProps({
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

// Access the theme store - this allows components to react to theme changes
const themeStore = useThemeStore();

// Computed property to determine if we're in dark mode
const isDarkMode = computed(() => {
  return themeStore.theme === 'dark' || 
    (themeStore.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
});
</script>

<style>
/* Using the theme variables consistently */
.form-field-wrapper label {
  color: rgb(var(--color-text));
}

.form-field-wrapper small {
  color: rgb(var(--color-text-secondary));
}

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
