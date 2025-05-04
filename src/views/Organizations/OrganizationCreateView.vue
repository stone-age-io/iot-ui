<template>
  <div class="organization-create-container">
    <PageHeader 
      title="Create Organization" 
      subtitle="Add a new organization to your account"
    >
      <template #actions>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-outlined"
          @click="$router.back()" 
        />
      </template>
    </PageHeader>
    
    <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
      <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
        <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Organization Information</h2>
      </div>
      <div class="p-6">
        <EntityForm
          :loading="loading"
          submit-label="Create Organization"
          @submit="handleSubmit"
          @cancel="$router.back()"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Name -->
            <FormField
              id="name"
              label="Organization Name"
              :required="true"
              :error-message="v$.name.$errors[0]?.$message"
              class="md:col-span-2"
            >
              <InputText
                id="name"
                v-model="organization.name"
                placeholder="My Organization"
                class="w-full form-input"
                :class="{ 'p-invalid': v$.name.$error }"
                @input="generateCode"
              />
            </FormField>
            
            <!-- Code -->
            <FormField
              id="code"
              label="Code"
              :required="true"
              :error-message="v$.code.$errors[0]?.$message"
              hint="Auto-generated from name; used for API and internal references"
            >
              <InputText
                id="code"
                v-model="organization.code"
                placeholder="my-organization"
                class="w-full font-mono form-input"
                :class="{ 'p-invalid': v$.code.$error }"
              />
            </FormField>
            
            <!-- Description -->
            <FormField
              id="description"
              label="Description"
              :error-message="v$.description.$errors[0]?.$message"
              class="md:col-span-2"
            >
              <Textarea
                id="description"
                v-model="organization.description"
                rows="3"
                placeholder="Enter a description for this organization"
                class="w-full form-input"
                :class="{ 'p-invalid': v$.description.$error }"
              />
            </FormField>
            
            <!-- Settings -->
            <FormField
              id="settings"
              label="Settings"
              help-text="Optional JSON settings for this organization"
              class="md:col-span-2"
            >
              <Textarea
                id="settings"
                v-model="settingsJson"
                rows="5"
                placeholder='{"key": "value", "nested": {"data": "value"}}'
                class="w-full form-input font-mono"
                :class="{ 'p-invalid': settingsError }"
                @change="validateSettingsJson"
              />
              <small v-if="settingsError" class="p-error block mt-1">
                {{ settingsError }}
              </small>
            </FormField>
          </div>
        </EntityForm>
      </div>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useOrganizationForm } from '../../composables/useOrganizationForm'
import PageHeader from '../../components/common/PageHeader.vue'
import EntityForm from '../../components/common/EntityForm.vue'
import FormField from '../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

// Use the organization form composable in create mode
const {
  organization,
  v$,
  loading,
  generateCode,
  submitForm,
  resetForm,
  validateSettings
} = useOrganizationForm('create')

// Settings handling
const settingsJson = ref('{}')
const settingsError = ref('')

// Watch for changes in settings JSON string and update organization.settings object
watch(settingsJson, (newValue) => {
  validateSettingsJson()
})

// Validate JSON settings and update organization object
const validateSettingsJson = () => {
  if (!settingsJson.value.trim()) {
    // Empty string is allowed, convert to empty object
    organization.value.settings = {}
    settingsError.value = ''
    return
  }
  
  try {
    const parsedSettings = JSON.parse(settingsJson.value)
    // Successful parse, update organization object
    organization.value.settings = parsedSettings
    settingsError.value = ''
  } catch (err) {
    settingsError.value = 'Invalid JSON format. Please check your syntax.'
    // Don't update organization.settings with invalid JSON
  }
}

// Handle form submission
const handleSubmit = async () => {
  // Validate settings before form submission
  validateSettingsJson()
  
  // Don't proceed if there's a settings error
  if (settingsError.value) {
    return false
  }
  
  // Submit the form using the composable
  return submitForm()
}

// Reset form on component mount
resetForm()
</script>

<style scoped>
/* Theme-aware styling */
.organization-create-container {
  margin-bottom: 2rem;
}

.form-input {
  transition: all 0.2s ease;
}

/* Fix PrimeVue components styling in dark mode */
:deep(.dark .p-inputtext),
:deep(.dark .p-dropdown),
:deep(.dark .p-inputnumber),
:deep(.dark .p-textarea) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}
</style>
