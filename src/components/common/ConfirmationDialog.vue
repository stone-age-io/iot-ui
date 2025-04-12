<!-- src/components/common/ConfirmationDialog.vue -->
<template>
  <Dialog 
    :visible="visible" 
    :style="{ width: '95%', maxWidth: '450px' }" 
    :modal="true"
    :closable="!loading"
    :closeOnEscape="!loading"
    @update:visible="$emit('update:visible', $event)"
    :header="title"
  >
    <div class="flex items-start">
      <div 
        class="w-10 h-10 rounded-full flex items-center justify-center mr-4" 
        :class="iconClass"
      >
        <i :class="[iconName, 'text-lg']"></i>
      </div>
      
      <div>
        <p class="text-gray-800 mb-2 dark:text-gray-200">{{ message }}</p>
        <p v-if="details" class="text-gray-600 text-sm dark:text-gray-400">{{ details }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 flex-wrap">
        <Button 
          @click="$emit('update:visible', false)"
          label="Cancel" 
          class="p-button-text w-full sm:w-auto order-2 sm:order-1"
          :disabled="loading"
          icon="pi pi-times"
        />
        <Button 
          @click="confirm"
          :label="confirmLabel"
          :icon="confirmIcon" 
          :class="[confirmButtonClass, 'w-full sm:w-auto order-1 sm:order-2']"
          :loading="loading"
          :disabled="loading"
          autofocus
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'warning', // warning, danger, info
    validator: (value) => ['warning', 'danger', 'info'].includes(value)
  },
  confirmLabel: {
    type: String,
    default: 'Confirm'
  },
  confirmIcon: {
    type: String,
    default: 'pi pi-check'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'update:visible'])

// Computed based on type
const iconClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    case 'warning':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    case 'info':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  }
})

const iconName = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'pi pi-exclamation-triangle'
    case 'warning':
      return 'pi pi-exclamation-circle'
    case 'info':
      return 'pi pi-info-circle'
    default:
      return 'pi pi-question-circle'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'p-button-danger'
    case 'warning':
      return 'p-button-warning'
    case 'info':
      return 'p-button-info'
    default:
      return 'p-button-primary'
  }
})

// Emit confirm event
const confirm = () => {
  emit('confirm')
}
</script>

<style scoped>
:deep(.p-dialog-header) {
  @apply dark:bg-gray-800 dark:text-white dark:border-gray-700;
}

:deep(.p-dialog-content) {
  @apply dark:bg-gray-800 dark:text-gray-200;
}

:deep(.p-dialog-footer) {
  @apply dark:bg-gray-800 dark:border-gray-700;
}
</style>
