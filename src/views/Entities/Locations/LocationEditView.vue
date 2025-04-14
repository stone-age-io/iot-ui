<!-- src/views/Entities/Locations/LocationEditView.vue -->
<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="initialLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner 
        strokeWidth="4" 
        :class="themeValue.class('text-primary-500', 'text-primary-400')" 
      />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="p-error-container p-6 text-center">
      <div :class="['text-xl mb-4', textColor.error]">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load location
      </div>
      <p :class="['mb-4', textColor.secondary]">{{ error }}</p>
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
      
      <Card>
        <template #title>
          <h2 :class="['text-xl font-semibold', textColor.primary]">Location Information</h2>
        </template>
        <template #content>
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
                hint="Not editable"
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
                        <span :class="['text-xs ml-2', textColor.secondary]">{{ getEdgeCode(slotProps.value) }}</span>
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
                        <div :class="textColor.primary">{{ slotProps.option.name }}</div>
                        <div :class="['text-xs', textColor.secondary]">{{ slotProps.option.code }}</div>
                      </div>
                    </div>
                  </template>
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex align-items-center">
                      <div>
                        {{ getParentDisplay(slotProps.value).name }}
                        <span :class="['text-xs ml-2', textColor.secondary]">{{ getParentDisplay(slotProps.value).code }}</span>
                      </div>
                    </div>
                    <span v-else>No Parent (Root Location)</span>
                  </template>
                </Dropdown>
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
              
              <!-- Type -->
              <FormField
                id="type"
                label="Type"
                :required="true"
                :error-message="validationErrors.type"
              >
                <Dropdown
                  id="type"
                  v-model="location.type"
                  :options="locationTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select Type"
                  class="w-full form-input"
                  :class="{ 'p-invalid': validationErrors.type }"
                />
              </FormField>
              
              <!-- Path -->
              <FormField
                id="path"
                label="Path"
                :required="true"
                :error-message="validationErrors.path"
                class="md:col-span-2"
              >
                <InputText
                  id="path"
                  v-model="location.path"
                  placeholder="floor-1/north-wing/reception"
                  class="w-full form-input"
                  :class="{ 'p-invalid': validationErrors.path }"
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
            </div>
            
            <!-- Edit notes -->
            <div class="mt-6 info-panel">
              <div class="flex items-start">
                <i :class="['pi pi-info-circle mt-0.5 mr-2', themeValue.class('text-blue-500', 'text-blue-400')]"></i>
                <div>
                  <p><strong>Note:</strong> The location code, level, zone, identifier, and edge cannot be changed after creation.</p>
                  <p class="mt-1">If you need to change these values, please create a new location and delete this one.</p>
                </div>
              </div>
            </div>
          </EntityForm>
        </template>
      </Card>
      
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
import { useTheme } from '../../../composables/useTheme'
import { useToast } from 'primevue/usetoast'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor } = useTheme()

// Get location functionality from location composable
const { fetchLocation } = useLocation()

// Use the location form composable in edit mode
const { 
  location, 
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
  getEdgeName,
  getEdgeCode,
  getParentDisplay,
  submitForm
} = useLocationForm('edit')

// Local state for initial loading and error handling
const initialLoading = ref(true)
const error = ref(null)

// Computed property to safely extract validation errors
const validationErrors = computed(() => {
  if (!v$.value) return {}
  
  return {
    name: v$.value.name && v$.value.name.$errors.length ? v$.value.name.$errors[0].$message : '',
    type: v$.value.type && v$.value.type.$errors.length ? v$.value.type.$errors[0].$message : '',
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
/* Theme-aware styling */
:deep(.p-card) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

:deep(.p-card .p-card-title) {
  padding: 1.25rem 1.5rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--surface-border);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

:deep(.p-card .p-card-content) {
  padding: 1.5rem;
}

:deep(.p-card .p-card-footer) {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-border);
}

/* Form input styling */
.form-input {
  transition: all 0.2s ease;
}

.disabled-field {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Info panel styling */
.info-panel {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-radius: 0.5rem;
  border: 1px solid var(--surface-border);
  padding: 1rem;
}

/* Error container styling */
.p-error-container {
  background-color: var(--surface-card);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--surface-border);
}

/* Fix PrimeVue Card styling in dark mode */
:deep(.dark .p-card),
:deep(.dark .p-card .p-card-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
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

/* Responsive adjustments */
@media (max-width: 640px) {
  :deep(.p-card .p-card-title),
  :deep(.p-card .p-card-content) {
    padding: 1rem;
  }
}
</style>
