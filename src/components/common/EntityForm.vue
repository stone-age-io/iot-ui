<template>
  <div class="entity-form-wrapper">
    <form @submit.prevent="submitForm">
      <div class="card bg-theme-surface dark:bg-gray-800">
        <!-- Form Title -->
        <h2 v-if="title" class="text-xl font-semibold mb-4 text-theme-primary dark:text-gray-200">{{ title }}</h2>
        
        <!-- Form Fields -->
        <div class="space-y-4">
          <slot></slot>
        </div>
        
        <!-- Submit buttons -->
        <div class="flex justify-end gap-3 mt-6 flex-wrap">
          <Button
            type="button"
            label="Cancel"
            class="p-button-outlined p-button-secondary w-full sm:w-auto order-2 sm:order-1"
            @click="$emit('cancel')"
            :disabled="loading"
          />
          
          <Button
            type="submit"
            :label="submitLabel"
            :loading="loading"
            class="w-full sm:w-auto order-1 sm:order-2"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';
import { useThemeStore } from '../../stores/theme';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  submitLabel: {
    type: String,
    default: 'Save'
  }
});

const emit = defineEmits(['submit', 'cancel']);

const themeStore = useThemeStore();

// Computed property to determine if we're in dark mode
const isDarkMode = computed(() => {
  return themeStore.theme === 'dark' || 
    (themeStore.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
});

const submitForm = () => {
  emit('submit');
};
</script>

<style>
/* The card class is already themed in the global CSS */
/* Entity form specific theming for PrimeVue components */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-multiselect),
:deep(.p-inputnumber),
:deep(.p-calendar),
:deep(.p-chips),
:deep(.p-textarea) {
  @apply dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200;
  background-color: var(--surface-overlay, #ffffff);
  color: var(--text-color, #374151);
  border-color: var(--surface-border, #e5e7eb);
}

:deep(.p-dropdown-panel),
:deep(.p-multiselect-panel),
:deep(.p-calendar-panel) {
  @apply dark:bg-gray-700 dark:border-gray-600;
  background-color: var(--surface-overlay, #ffffff);
  border-color: var(--surface-border, #e5e7eb);
}

:deep(.p-dropdown-items),
:deep(.p-multiselect-items),
:deep(.p-calendar-header) {
  @apply dark:bg-gray-700;
  background-color: var(--surface-overlay, #ffffff);
}

:deep(.p-dropdown-item),
:deep(.p-multiselect-item),
:deep(.p-calendar-today-button) {
  @apply dark:text-gray-300 dark:hover:bg-gray-600;
  color: var(--text-color, #374151);
}

:deep(.p-dropdown-item.p-highlight),
:deep(.p-multiselect-item.p-highlight) {
  @apply dark:bg-primary-700 dark:text-white;
  background-color: var(--primary-color, #3b82f6);
  color: var(--primary-color-text, #ffffff);
}

:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  @apply dark:bg-primary-600;
  background: var(--primary-color, #3b82f6);
}

:deep(.p-invalid) {
  @apply dark:border-red-500;
  border-color: var(--red-500, #ef4444);
}

/* Use CSS variables to ensure transitions between themes are smooth */
:deep(*) {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
</style>
