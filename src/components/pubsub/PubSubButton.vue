<!-- src/components/pubsub/PubSubButton.vue -->
<template>
  <div 
    class="pubsub-button-wrapper"
    :class="{ 'edit-mode': editMode }"
  >
    <Button 
      :label="button.label"
      :class="[
        buttonClasses,
        editMode ? 'pointer-events-none' : ''
      ]"
      @click="!editMode && $emit('click', button)"
    />
    
    <!-- Edit controls shown only in edit mode -->
    <div 
      v-if="editMode" 
      class="edit-controls"
    >
      <Button 
        icon="pi pi-pencil" 
        class="p-button-rounded p-button-sm p-button-text" 
        @click="$emit('edit', button)"
      />
      <Button 
        icon="pi pi-trash" 
        class="p-button-rounded p-button-sm p-button-text p-button-danger" 
        @click="$emit('delete', button)"
      />
    </div>
    
    <!-- Topic badge shown only in edit mode -->
    <div 
      v-if="editMode && button.topic" 
      class="topic-badge"
    >
      {{ button.topic }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';

// Define props
const props = defineProps({
  button: {
    type: Object,
    required: true
  },
  editMode: {
    type: Boolean,
    default: false
  }
});

// Define emits
const emit = defineEmits(['click', 'edit', 'delete']);

// Computed classes for button styling based on config
const buttonClasses = computed(() => {
  const classes = ['w-full'];
  
  // First ensure we have the base primevue button styles visible
  classes.push('p-button');
  
  // Add color class based on the button style
  if (props.button.style?.color) {
    switch (props.button.style.color) {
      case 'primary':
        classes.push('p-button-primary');
        break;
      case 'secondary':
        classes.push('p-button-secondary');
        break;
      case 'success':
        classes.push('p-button-success');
        break;
      case 'info':
        classes.push('p-button-info');
        break;
      case 'warning':
        classes.push('p-button-warning');
        break;
      case 'danger':
        classes.push('p-button-danger');
        break;
      default:
        // Ensure we have some coloring as a fallback
        classes.push('p-button-primary');
    }
  } else {
    // Default to primary if no color specified
    classes.push('p-button-primary');
  }
  
  // Add size class
  if (props.button.style?.size === 'small') {
    classes.push('p-button-sm');
  } else if (props.button.style?.size === 'large') {
    classes.push('p-button-lg');
  }
  
  return classes;
});
</script>

<style scoped>
.pubsub-button-wrapper {
  position: relative;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

.pubsub-button-wrapper.edit-mode {
  padding: 1rem;
  border: 1px dashed var(--surface-border, #e5e7eb);
  border-radius: 0.375rem;
  background-color: rgba(0, 0, 0, 0.02);
}

.edit-controls {
  position: absolute;
  top: -10px;
  right: -10px;
  display: flex;
  gap: 0.25rem;
  background: var(--surface-card, #ffffff);
  border-radius: 9999px;
  padding: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.topic-badge {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-section, #ffffff);
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.7rem;
  color: var(--text-color-secondary, #6b7280);
  white-space: nowrap;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 5;
}

/* Dark mode adjustments */
:global(.dark) .pubsub-button-wrapper.edit-mode {
  background-color: rgba(255, 255, 255, 0.02);
  border-color: var(--surface-border, #4b5563);
}

:global(.dark) .edit-controls {
  background: var(--surface-card, #1f2937);
}

:global(.dark) .topic-badge {
  background: var(--surface-section, #1f2937);
  border-color: var(--surface-border, #4b5563);
  color: var(--text-color-secondary, #9ca3af);
}

/* Override Button appearance */
:deep(.p-button) {
  /* Ensure the button background is visible */
  background-color: var(--primary-color, #3B82F6);
  color: #ffffff;
  border: 1px solid var(--primary-color, #3B82F6);
  padding: 0.5rem 1rem;
}

/* Color variants */
:deep(.p-button-secondary) {
  background-color: #64748b;
  border-color: #64748b;
}

:deep(.p-button-success) {
  background-color: #10b981;
  border-color: #10b981;
}

:deep(.p-button-info) {
  background-color: #0ea5e9;
  border-color: #0ea5e9;
}

:deep(.p-button-warning) {
  background-color: #f59e0b;
  border-color: #f59e0b;
}

:deep(.p-button-danger) {
  background-color: #ef4444;
  border-color: #ef4444;
}

/* Dark mode button colors */
:global(.dark) :deep(.p-button) {
  /* Slightly lighter colors for dark mode */
  background-color: var(--primary-color, #60A5FA);
  border-color: var(--primary-color, #60A5FA);
}

:global(.dark) :deep(.p-button-secondary) {
  background-color: #94a3b8;
  border-color: #94a3b8;
}

:global(.dark) :deep(.p-button-success) {
  background-color: #34d399;
  border-color: #34d399;
}

:global(.dark) :deep(.p-button-info) {
  background-color: #38bdf8;
  border-color: #38bdf8;
}

:global(.dark) :deep(.p-button-warning) {
  background-color: #fbbf24;
  border-color: #fbbf24;
}

:global(.dark) :deep(.p-button-danger) {
  background-color: #f87171;
  border-color: #f87171;
}
</style>
