<!-- src/components/common/EntityForm.vue -->
<template>
  <div class="entity-form-wrapper">
    <form @submit.prevent="submitForm">
      <div class="card bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-sm theme-transition p-5">
        <!-- Form Title -->
        <h2 v-if="title" class="text-xl font-semibold mb-4 text-content-primary dark:text-content-primary-dark">{{ title }}</h2>
        
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
import { useTheme } from '../../composables/useTheme';

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

const { isDarkMode } = useTheme();

const submitForm = () => {
  emit('submit');
};
</script>

<style>
/* Entity form specific theming for PrimeVue components */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-multiselect),
:deep(.p-inputnumber),
:deep(.p-calendar),
:deep(.p-chips),
:deep(.p-textarea) {
  @apply dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200;
}

:deep(.p-dropdown-panel),
:deep(.p-multiselect-panel),
:deep(.p-calendar-panel) {
  @apply dark:bg-gray-700 dark:border-gray-600;
}

:deep(.p-dropdown-items),
:deep(.p-multiselect-items),
:deep(.p-calendar-header) {
  @apply dark:bg-gray-700;
}

:deep(.p-dropdown-item),
:deep(.p-multiselect-item),
:deep(.p-calendar-today-button) {
  @apply dark:text-gray-300 dark:hover:bg-gray-600;
}

:deep(.p-dropdown-item.p-highlight),
:deep(.p-multiselect-item.p-highlight) {
  @apply dark:bg-primary-700 dark:text-white;
}

:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  @apply dark:bg-primary-600;
}

:deep(.p-invalid) {
  @apply dark:border-red-500;
}

/* Use CSS variables to ensure transitions between themes are smooth */
:deep(*) {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
</style>
