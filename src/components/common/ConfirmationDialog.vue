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
    class="confirmation-dialog theme-transition"
  >
    <div class="flex items-start">
      <div 
        class="w-10 h-10 rounded-full flex items-center justify-center mr-4 theme-transition" 
        :class="iconBackgroundClass"
      >
        <i :class="[iconName, 'text-lg']" :style="{ color: iconColor }"></i>
      </div>
      
      <div>
        <p class="text-theme-primary dark:text-gray-200 mb-2">{{ message }}</p>
        <p v-if="details" class="text-theme-secondary dark:text-gray-400 text-sm">{{ details }}</p>
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
import { useTheme } from '../../composables/useTheme'

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

// Access theme system
const { isDarkMode, themeValue } = useTheme()

// Get the appropriate classes and colors based on type and theme
const iconBackgroundClass = computed(() => {
  // Use the themeValue helper to get theme-specific values
  return themeValue.class(
    // Light theme classes
    {
      danger: 'bg-red-100',
      warning: 'bg-amber-100',
      info: 'bg-blue-100'
    }[props.type] || 'bg-gray-100',
    // Dark theme classes
    {
      danger: 'bg-red-900/30',
      warning: 'bg-amber-900/30',
      info: 'bg-blue-900/30'
    }[props.type] || 'bg-gray-700'
  )
})

const iconColor = computed(() => {
  return isDarkMode.value 
    ? {
        danger: 'var(--red-400, #f87171)',
        warning: 'var(--amber-400, #fbbf24)',
        info: 'var(--blue-400, #60a5fa)'
      }[props.type] || 'var(--gray-400, #9ca3af)'
    : {
        danger: 'var(--red-600, #dc2626)',
        warning: 'var(--amber-600, #d97706)',
        info: 'var(--blue-600, #2563eb)'
      }[props.type] || 'var(--gray-600, #4b5563)'
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
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  border-color: rgb(var(--color-border));
}

:deep(.p-dialog-content) {
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
}

:deep(.p-dialog-footer) {
  background-color: rgb(var(--color-surface));
  border-color: rgb(var(--color-border));
}

/* Add smooth transitions for theme changes */
.theme-transition,
.theme-transition * {
  transition: background-color 0.2s ease,
              color 0.2s ease,
              border-color 0.2s ease;
}
</style>
