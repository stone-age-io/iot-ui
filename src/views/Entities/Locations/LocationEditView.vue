<!-- src/views/Entities/Locations/LocationEditView.vue -->
<template>
  <div>
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
        Failed to load location
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Location Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Location" 
        :subtitle="location ? `Updating ${location.code}` : 'Loading...'"
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
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Location Information</h2>
        </div>
        <div class="p-6">
          <EntityForm
            :loading="loading"
            submit-label="Save Changes"
            @submit="submitForm"
            @cancel="$router.back()"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Code (readonly) -->
              <FormField
                id="code"
                label="Code"
                :required="true"
                hint="Not editable after creation"
              >
                <InputText
                  id="code"
                  v-model="location.code"
                  class="w-full font-mono form-input disabled-field"
                  readonly
                  disabled
                />
              </FormField>
              
              <!-- Edge (readonly) -->
              <FormField
                id="edge_id"
                label="Edge"
                :required="true"
                hint="Not editable after creation"
              >
                <Dropdown
                  id="edge_id"
                  v-model="location.edge_id"
                  :options="edges"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select Edge"
                  class="w-full form-input disabled-field"
                  disabled
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex align-items-center">
                      <div>
                        {{ getEdgeName(slotProps.value) }}
                        <span class="text-xs ml-2 text-content-secondary dark:text-content-secondary-dark">{{ getEdgeCode(slotProps.value) }}</span>
                      </div>
                    </div>
                    <span v-else>Select Edge</span>
                  </template>
                </Dropdown>
              </FormField>
              
              <!-- Parent Location -->
              <FormField
                id="parent_id"
                label="Parent Location"
                :error-message="circularReferenceError ? 'Cannot create circular reference' : ''"
              >
                <Dropdown
                  id="parent_id"
                  v-model="location.parent_id"
                  :options="potentialParents"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select Parent (Optional)"
                  class="w-full form-input"
                  :class="{ 'p-invalid': circularReferenceError }"
                  :loading="parentsLoading"
                  :filter="true"
                >
                  <template #option="slotProps">
                    <div class="flex align-items-center">
                      <div>
                        <div class="text-content-primary dark:text-content-primary-dark">{{ slotProps.option.name }}</div>
                        <div class="text-xs text-content-secondary dark:text-content-secondary-dark">{{ slotProps.option.code }}</div>
                      </div>
                    </div>
                  </template>
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex align-items-center">
                      <div>
                        {{ getParentDisplay(slotProps.value).name }}
                        <span class="text-xs ml-2 text-content-secondary dark:text-content-secondary-dark">{{ getParentDisplay(slotProps.value).code }}</span>
                      </div>
                    </div>
                    <span v-else>No Parent (Root Location)</span>
                  </template>
                </Dropdown>
                <small v-if="location.parent_id" class="text-content-secondary dark:text-content-secondary-dark mt-1 block">
                  Note: Changing parent will update the location's path automatically.
                </small>
              </FormField>
              
              <!-- Type (readonly) -->
              <FormField
                id="type"
                label="Location Type"
                hint="Type components are not editable after creation"
              >
                <InputText
                  id="type"
                  v-model="typeDisplay"
                  class="w-full form-input disabled-field"
                  readonly
                  disabled
                />
              </FormField>
              
              <!-- Name -->
              <FormField
                id="name"
                label="Name"
                :required="true"
                :error-message="validationErrors.name"
              >
                <InputText
                  id="name"
                  v-model="location.name"
                  placeholder="North Reception Area"
                  class="w-full form-input"
                  :class="{ 'p-invalid': validationErrors.name }"
                />
              </FormField>
              
              <!-- Path (calculated field) -->
              <FormField
                id="path"
                label="Path"
                :required="true"
                :error-message="validationErrors.path"
                class="md:col-span-2"
                hint="Auto-updated when parent changes"
              >
                <InputText
                  id="path"
                  v-model="location.path"
                  placeholder="floor-1/north-wing/room-101"
                  class="w-full form-input"
                  :class="{ 'p-invalid': validationErrors.path }"
                  readonly
                />
              </FormField>
              
              <!-- Description -->
              <FormField
                id="description"
                label="Description"
                :error-message="validationErrors.description"
                class="md:col-span-2"
              >
                <Textarea
                  id="description"
                  v-model="location.description"
                  rows="3"
                  placeholder="Enter a description for this location"
                  class="w-full form-input"
                  :class="{ 'p-invalid': validationErrors.description }"
                />
              </FormField>
              
              <!-- Metadata -->
              <FormField
                id="metadata"
                label="Metadata (JSON)"
                :error-message="metadataError"
                class="md:col-span-2"
                help-text='Custom attributes as JSON object (e.g., {"capacity": 10, "area": "250sqm"})'
              >
                <Textarea
                  id="metadata"
                  v-model="metadataString"
                  rows="5"
                  placeholder="{}"
                  class="w-full form-input font-mono text-sm"
                  :class="{ 'p-invalid': metadataError }"
                />
              </FormField>
            </div>
            
            <!-- Edit notes -->
            <div class="mt-6 p-4 rounded-lg border border-border-light dark:border-border-light-dark bg-surface-secondary dark:bg-surface-secondary-dark theme-transition">
              <div class="flex items-start">
                <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500 dark:text-blue-400"></i>
                <div>
                  <p class="text-content-primary dark:text-content-primary-dark"><strong>Note:</strong> The location code, type, and edge cannot be changed after creation.</p>
                  <p class="mt-1 text-content-secondary dark:text-content-secondary-dark">Changing the parent location will automatically update the path to maintain consistency with the location hierarchy.</p>
                  <p class="mt-1 text-content-secondary dark:text-content-secondary-dark">Metadata must be a valid JSON object and can be used to store additional custom attributes.</p>
                </div>
              </div>
            </div>
          </EntityForm>
        </div>
      </div>
      
      <!-- Toast for success/error messages -->
      <Toast />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocation } from '../../../composables/useLocation'
import { useLocationForm } from '../../../composables/useLocationForm'
import { useToast } from 'primevue/usetoast'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Get location functionality from location composable
const { fetchLocation } = useLocation()

// Use the location form composable in edit mode
const { 
  location, 
  metadataString,
  metadataError,
  v$, 
  loading, 
  edges,
  edgesLoading,
  potentialParents,
  parentsLoading,
  circularReferenceError,
  locationTypes,
  fetchEdges,
  fetchPotentialParents,
  loadLocation,
  updatePath,
  getEdgeName,
  getEdgeCode,
  getParentDisplay,
  validateMetadata,
  updateMetadataString,
  submitForm,
  parseLocationCode
} = useLocationForm('edit')

// Local state for initial loading and error handling
const initialLoading = ref(true)
const error = ref(null)

// Display for the location type (combines type-number for readability)
const typeDisplay = computed(() => {
  if (!location.value || !location.value.code) {
    return '';
  }
  // Get the parts from the code
  const parts = parseLocationCode(location.value.code)
  
  // Find the display name for the type
  const typeObj = locationTypes.value.find(t => t.value === parts.type)
  const typeName = typeObj ? typeObj.label : parts.type
  
  return `${typeName} ${parts.number}`
})

// Computed property to safely extract validation errors
const validationErrors = computed(() => {
  if (!v$.value) return {}
  
  return {
    name: v$.value.name && v$.value.name.$errors.length ? v$.value.name.$errors[0].$message : '',
    path: v$.value.path && v$.value.path.$errors.length ? v$.value.path.$errors[0].$message : '',
    description: v$.value.description && v$.value.description.$errors.length ? v$.value.description.$errors[0].$message : ''
  }
})

// Fetch location data on component mount
onMounted(async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Location ID is missing'
    initialLoading.value = false
    return
  }
  
  try {
    // Fetch edges first
    await fetchEdges()
    
    // Fetch location data
    const locationData = await fetchLocation(id)
    
    // Load data into form if location exists
    if (locationData) {
      loadLocation(locationData)
      
      // Fetch potential parent locations, excluding self and children
      await fetchPotentialParents(id)
    } else {
      error.value = 'Location not found'
    }
  } catch (err) {
    error.value = 'Failed to load location data'
    console.error('Error in LocationEditView:', err)
  } finally {
    initialLoading.value = false
  }
})
</script>

<style scoped>
/* Form input styling */
.form-input {
  transition: all 0.2s ease;
}

.disabled-field {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Fix disabled input styling in dark mode */
:deep(.dark .p-inputtext:disabled),
:deep(.dark .p-dropdown.p-disabled),
:deep(.dark .p-inputnumber.p-disabled),
:deep(.dark .p-textarea.p-disabled) {
  background-color: var(--surface-hover);
  color: var(--text-color-secondary);
  opacity: 0.7;
  border-color: var(--surface-border);
}

:deep(.dark .p-inputtext),
:deep(.dark .p-dropdown),
:deep(.dark .p-inputnumber),
:deep(.dark .p-textarea) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-dropdown-panel),
:deep(.dark .p-dropdown-items-wrapper) {
  background-color: var(--surface-hover);
  color: var(--text-color);
}

:deep(.dark .p-dropdown-item) {
  color: var(--text-color);
}

:deep(.dark .p-dropdown-item:hover) {
  background-color: var(--primary-400);
  color: var(--primary-color-text);
}
</style>
