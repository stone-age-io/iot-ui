<template>
  <div class="organization-edit-container">
    <!-- Loading Spinner -->
    <div v-if="initialLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner 
        strokeWidth="4" 
        class="text-primary-500 dark:text-primary-400" 
      />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="p-error-container p-6 text-center bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark rounded-lg shadow-theme-md">
      <div class="text-xl mb-4 text-red-600 dark:text-red-400">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load organization
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Organization Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Organization" 
        :subtitle="`Updating ${organization.name}`"
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
            submit-label="Save Changes"
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
                />
              </FormField>
              
              <!-- Code (readonly) -->
              <FormField
                id="code"
                label="Code"
                :required="true"
                hint="Organization code cannot be changed after creation"
              >
                <InputText
                  id="code"
                  v-model="organization.code"
                  class="w-full font-mono form-input disabled-field"
                  readonly
                  disabled
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
                help-text="JSON settings for this organization"
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
            
            <!-- Edit notes -->
            <div class="mt-6 p-4 rounded-lg border border-border-light dark:border-border-light-dark bg-surface-secondary dark:bg-surface-secondary-dark theme-transition">
              <div class="flex items-start">
                <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500 dark:text-blue-400"></i>
                <div>
                  <p class="text-content-primary dark:text-content-primary-dark"><strong>Note:</strong> The organization code cannot be changed after creation.</p>
                  <p class="mt-1 text-content-secondary dark:text-content-secondary-dark">This code is used internally for API references and data management.</p>
                </div>
              </div>
            </div>
          </EntityForm>
        </div>
      </div>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useOrganization } from '../../composables/useOrganization'
import { useOrganizationForm } from '../../composables/useOrganizationForm'
import { organizationService } from '../../services/organization/organizationService'
import PageHeader from '../../components/common/PageHeader.vue'
import EntityForm from '../../components/common/EntityForm.vue'
import FormField from '../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()

// Track initial loading state separately from form loading
const initialLoading = ref(true)
const error = ref(null)

// Get organization functionality from composable
const { fetchOrganization } = useOrganization()

// Use the organization form composable in edit mode
const { 
  organization, 
  v$, 
  loading, 
  loadOrganization, 
  submitForm,
  validateSettings 
} = useOrganizationForm('edit')

// Settings handling
const settingsJson = ref('{}')
const settingsError = ref('')
const originalSettings = ref({})

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

// Handle form submission with settings validation
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

// Watch for changes in organization.settings and update the JSON string
watch(() => organization.value.settings, (newSettings) => {
  if (newSettings && typeof newSettings === 'object') {
    try {
      settingsJson.value = JSON.stringify(newSettings, null, 2)
    } catch (e) {
      console.error("Error stringifying settings:", e)
      settingsJson.value = '{}'
    }
  } else {
    settingsJson.value = '{}'
  }
}, { immediate: true, deep: true })

// Load organization data on component mount
onMounted(async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch organization data
    const response = await organizationService.getById(id)
    
    // Load data into form
    if (response && response.data) {
      loadOrganization(response.data)
      
      // Store original settings for comparison
      originalSettings.value = {...response.data.settings} || {}
      
      // Initialize settings JSON
      if (response.data.settings && Object.keys(response.data.settings).length > 0) {
        settingsJson.value = JSON.stringify(response.data.settings, null, 2)
      } else {
        settingsJson.value = '{}'
      }
    }
  } catch (err) {
    console.error('Failed to load organization:', err)
    error.value = err.message || 'Failed to load organization details'
  } finally {
    initialLoading.value = false
  }
})
</script>

<style scoped>
/* Theme-aware styling */
.organization-edit-container {
  margin-bottom: 2rem;
}

.form-input {
  transition: all 0.2s ease;
}

.disabled-field {
  opacity: 0.7;
  cursor: not-allowed;
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

:deep(.dark .p-inputtext:disabled),
:deep(.dark .p-dropdown.p-disabled),
:deep(.dark .p-inputnumber.p-disabled),
:deep(.dark .p-textarea.p-disabled) {
  background-color: var(--surface-hover);
  color: var(--text-color-secondary);
  opacity: 0.7;
  border-color: var(--surface-border);
}
</style>
