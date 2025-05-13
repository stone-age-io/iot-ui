<template>
  <div class="edge-edit-container">
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
        Failed to load edge
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Edge Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Edge" 
        :subtitle="`Updating ${edge.code}`"
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
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Edge Information</h2>
        </div>
        <div class="p-6">
          <EntityForm
            :loading="loading"
            submit-label="Save Changes"
            @submit="handleSubmit"
            @cancel="$router.back()"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Code (readonly) -->
              <FormField
                id="code"
                label="Code"
                :required="true"
                hint="Not editable"
              >
                <InputText
                  id="code"
                  v-model="edge.code"
                  class="w-full font-mono form-input disabled-field"
                  readonly
                  disabled
                />
              </FormField>
              
              <!-- Name -->
              <FormField
                id="name"
                label="Name"
                :required="true"
                :error-message="v$.name.$errors[0]?.$message"
              >
                <InputText
                  id="name"
                  v-model="edge.name"
                  placeholder="Main Office Building"
                  class="w-full form-input"
                  :class="{ 'p-invalid': v$.name.$error }"
                />
              </FormField>
              
              <!-- Type (readonly after creation) -->
              <FormField
                id="type"
                label="Type"
                hint="Read-only after creation"
              >
                <Dropdown
                  id="type"
                  v-model="edge.type"
                  :options="edgeTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select Edge Type"
                  class="w-full form-input disabled-field"
                  disabled
                />
              </FormField>
              
              <!-- Region (readonly after creation) -->
              <FormField
                id="region"
                label="Region"
                hint="Read-only after creation"
              >
                <Dropdown
                  id="region"
                  v-model="edge.region"
                  :options="edgeRegions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select Region"
                  class="w-full form-input disabled-field"
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
                  v-model="edge.description"
                  rows="3"
                  placeholder="Enter a description for this edge installation"
                  class="w-full form-input"
                  :class="{ 'p-invalid': v$.description.$error }"
                />
              </FormField>
              
              <!-- Metadata -->
              <FormField
                id="metadata"
                label="Metadata"
                help-text="Edit or update JSON metadata for this edge"
                class="md:col-span-2"
              >
                <Textarea
                  id="metadata"
                  v-model="metadataJson"
                  rows="5"
                  placeholder='{"key": "value", "nested": {"data": "value"}}'
                  class="w-full form-input font-mono"
                  :class="{ 'p-invalid': metadataError }"
                  @change="validateMetadataJson"
                />
                <small v-if="metadataError" class="p-error block mt-1">
                  {{ metadataError }}
                </small>
              </FormField>
              
              <!-- Active Status -->
              <FormField
                id="active"
                label="Status"
              >
                <div class="flex items-center mt-2">
                  <InputSwitch
                    id="active"
                    v-model="edge.active"
                    class="mr-2"
                  />
                  <label 
                    for="active" 
                    class="cursor-pointer text-content-primary dark:text-content-primary-dark"
                  >
                    {{ edge.active ? 'Active' : 'Inactive' }}
                  </label>
                </div>
              </FormField>
            </div>
            
            <!-- Edit notes -->
            <div class="mt-6 p-4 rounded-lg border border-border-light dark:border-border-light-dark bg-surface-secondary dark:bg-surface-secondary-dark theme-transition">
              <div class="flex items-start">
                <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500 dark:text-blue-400"></i>
                <div>
                  <p class="text-content-primary dark:text-content-primary-dark"><strong>Note:</strong> The edge code, type, and region cannot be changed after creation.</p>
                  <p class="mt-1 text-content-secondary dark:text-content-secondary-dark">If you need to change these values, please create a new edge and delete this one.</p>
                </div>
              </div>
            </div>
          </EntityForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEdge } from '../../../composables/useEdge'
import { useEdgeForm } from '../../../composables/useEdgeForm'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()

// Track initial loading state separately from form loading
const initialLoading = ref(true)

// Get edge functionality from composable
const { fetchEdge, error } = useEdge()

// Use the edge form composable in edit mode
const { 
  edge, 
  v$, 
  loading, 
  edgeTypes, 
  edgeRegions,
  loadEdge, 
  submitForm,
  validateMetadata 
} = useEdgeForm('edit')

// Metadata handling
const metadataJson = ref('{}')
const metadataError = ref('')
const originalMetadata = ref({})

// Validate JSON metadata and update edge object
const validateMetadataJson = () => {
  if (!metadataJson.value.trim()) {
    // Empty string is allowed, convert to empty object
    edge.value.metadata = {}
    metadataError.value = ''
    return
  }
  
  try {
    const parsedMetadata = JSON.parse(metadataJson.value)
    // Successful parse, update edge object
    edge.value.metadata = parsedMetadata
    metadataError.value = ''
  } catch (err) {
    metadataError.value = 'Invalid JSON format. Please check your syntax.'
    // Don't update edge.metadata with invalid JSON
  }
}

// Handle form submission with metadata validation
const handleSubmit = async () => {
  // Validate metadata before form submission
  validateMetadataJson()
  
  // Don't proceed if there's a metadata error
  if (metadataError.value) {
    return false
  }
  
  // Submit the form using the composable
  return submitForm()
}

// Watch for changes in edge.metadata and update the JSON string
watch(() => edge.value.metadata, (newMetadata) => {
  if (newMetadata && typeof newMetadata === 'object') {
    try {
      metadataJson.value = JSON.stringify(newMetadata, null, 2)
    } catch (e) {
      console.error("Error stringifying metadata:", e)
      metadataJson.value = '{}'
    }
  } else {
    metadataJson.value = '{}'
  }
}, { immediate: true, deep: true })

// Load edge data on component mount
onMounted(async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch edge data
    const edgeData = await fetchEdge(id)
    
    // Load data into form
    if (edgeData) {
      loadEdge(edgeData)
      
      // Store original metadata for comparison
      originalMetadata.value = {...edgeData.metadata} || {}
      
      // Initialize metadata JSON
      if (edgeData.metadata && Object.keys(edgeData.metadata).length > 0) {
        metadataJson.value = JSON.stringify(edgeData.metadata, null, 2)
      } else {
        metadataJson.value = '{}'
      }
    }
  } catch (err) {
    console.error('Failed to load edge:', err)
  } finally {
    initialLoading.value = false
  }
})
</script>

<style scoped>
/* Theme-aware styling */
.edge-edit-container {
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
