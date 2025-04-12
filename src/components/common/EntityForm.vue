<!-- src/components/common/EntityForm.vue -->
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

<style scoped>
/* The card class is already themed in the global CSS */
/* But we can add component-specific theme styles here if needed */
</style>
