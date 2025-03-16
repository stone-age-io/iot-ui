<template>
  <div class="entity-form-wrapper">
    <form @submit.prevent="submitForm">
      <div class="card">
        <!-- Form Title -->
        <h2 v-if="title" class="text-xl font-semibold mb-4">{{ title }}</h2>
        
        <!-- Form Fields -->
        <div class="space-y-4">
          <slot></slot>
        </div>
        
        <!-- Submit buttons -->
        <div class="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            label="Cancel"
            class="p-button-outlined p-button-secondary"
            @click="$emit('cancel')"
            :disabled="loading"
          />
          
          <Button
            type="submit"
            :label="submitLabel"
            :loading="loading"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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
