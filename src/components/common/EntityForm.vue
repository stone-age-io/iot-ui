<template>
  <div class="entity-form-wrapper">
    <form @submit.prevent="submitForm">
      <div class="card">
        <!-- Form Title -->
        <h2 v-if="title" class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">{{ title }}</h2>
        
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
import Button from 'primevue/button'

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
})

const emit = defineEmits(['submit', 'cancel'])

const submitForm = () => {
  emit('submit')
}
</script>

<style scoped>
/* The card class is already themed in the global CSS */
/* Entity form specific theming */
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
</style>

