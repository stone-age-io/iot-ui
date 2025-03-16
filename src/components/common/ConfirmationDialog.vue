<template>
  <Dialog 
    :visible="visible" 
    :style="{ width: '450px' }" 
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
        <p class="text-gray-800 mb-2">{{ message }}</p>
        <p v-if="details" class="text-gray-600 text-sm">{{ details }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button 
          @click="$emit('update:visible', false)"
          label="Cancel" 
          class="p-button-text"
          :disabled="loading"
          icon="pi pi-times"
        />
        <Button 
          @click="confirm"
          :label="confirmLabel"
          :icon="confirmIcon" 
          :class="confirmButtonClass" 
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
      return 'bg-red-100 text-red-600'
    case 'warning':
      return 'bg-amber-100 text-amber-600'
    case 'info':
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
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
