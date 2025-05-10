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
  
  // Add color class
  if (props.button.style?.color) {
    classes.push(`p-button-${props.button.style.color}`);
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
  background: var(--surface-card);
  border-radius: 9999px;
  padding: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.topic-badge {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-section);
  border: 1px solid var(--surface-border);
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 5;
}

/* Dark mode adjustments */
:deep(.dark) .pubsub-button-wrapper.edit-mode {
  background-color: rgba(255, 255, 255, 0.02);
  border-color: var(--surface-border, #4b5563);
}

:deep(.dark) .edit-controls {
  background: var(--surface-card);
}

:deep(.dark) .topic-badge {
  background: var(--surface-section);
  border-color: var(--surface-border);
}
</style>
