<template>
  <div class="form-field-wrapper mb-4">
    <div class="flex justify-between items-start mb-1">
      <label :for="id" class="block text-sm font-medium text-gray-700">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </label>
      <small v-if="hint" class="text-gray-500">{{ hint }}</small>
    </div>
    
    <slot></slot>
    
    <small class="p-error block mt-1" v-if="errorMessage">
      {{ errorMessage }}
    </small>
    
    <small v-if="helpText" class="text-gray-500 mt-1 block">
      {{ helpText }}
    </small>
  </div>
</template>

<script setup>
defineProps({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  hint: {
    type: String,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  }
})
</script>
