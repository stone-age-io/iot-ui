<template>
  <div class="location-create-container">
    <PageHeader 
      title="Create Location" 
      subtitle="Add a new physical location to your infrastructure"
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
          submit-label="Create Location"
          @submit="submitForm"
          @cancel="$router.back()"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Edge (required) -->
            <FormField
              id="edge_id"
              label="Edge"
              :required="true"
              :error-message="v$.edge_id.$errors[0]?.$message"
            >
              <Dropdown
                id="edge_id"
                v-model="location.edge_id"
                :options="edges"
                optionLabel="name"
                optionValue="id"
                placeholder="Select Edge"
                class="w-full form-input"
                :class="{ 'p-invalid': v$.edge_id.$error }"
                :loading="edgesLoading"
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
                      {{ getEdgeName(slotProps.value) }}
                      <span class="text-xs ml-2 text-content-secondary dark:text-content-secondary-dark">{{ getEdgeCode(slotProps.value) }}</span>
                    </div>
                  </div>
                  <span v-else class="text-content-secondary dark:text-content-secondary-dark">Select Edge</span>
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
                  <span v-else class="text-content-secondary dark:text-content-secondary-dark">No Parent (Root Location)</span>
                </template>
              </Dropdown>
            </FormField>
            
            <!-- Location Type -->
            <FormField
              id="type"
              label="Location Type"
              :required="true"
              :error-message="v$.type.$errors[0]?.$message"
            >
              <Dropdown
                id="type"
                v-model="location.type"
                :options="locationTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Type"
                class="w-full form-input"
                :class="{ 'p-invalid': v$.type.$error }"
                @change="updateCode"
              />
            </FormField>
            
            <!-- Number Identifier -->
            <FormField
              id="number"
              label="Number Identifier"
              :required="true"
              :error-message="v$.number.$errors[0]?.$message"
              help-text="Unique identifier for this location (e.g., 101, A5)"
            >
              <InputText
                id="number"
                v-model="location.number"
                placeholder="101"
                class="w-full form-input"
                :class="{ 'p-invalid': v$.number.$error }"
                @input="updateCode"
              />
            </FormField>
            
            <!-- Code (calculated field) -->
            <FormField
              id="code"
              label="Code"
              :required="true"
              :error-message="v$.code.$errors[0]?.$message"
              help-text="Auto-generated from type and number"
            >
              <InputText
                id="code"
                v-model="location.code"
                placeholder="room-101"
                class="w-full font-mono form-input code-field"
                :class="{ 'p-invalid': v$.code.$error }"
                readonly
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
                v-model="location.name"
                placeholder="North Reception Area"
                class="w-full form-input"
                :class="{ 'p-invalid': v$.name.$error }"
              />
            </FormField>
            
            <!-- Path (calculated field) -->
            <FormField
              id="path"
              label="Path"
              :required="true"
              :error-message="v$.path.$errors[0]?.$message"
              class="md:col-span-2"
              help-text="Auto-generated based on parent location and code"
            >
              <InputText
                id="path"
                v-model="location.path"
                placeholder="floor-1/north-wing/room-101"
                class="w-full form-input"
                :class="{ 'p-invalid': v$.path.$error }"
                readonly
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
                v-model="location.description"
                rows="3"
                placeholder="Enter a description for this location"
                class="w-full form-input"
                :class="{ 'p-invalid': v$.description.$error }"
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
          
          <!-- Form guidance -->
          <div class="mt-6 p-4 rounded-md text-sm bg-surface-secondary dark:bg-surface-secondary-dark border border-border-secondary dark:border-border-secondary-dark text-content-secondary dark:text-content-secondary-dark">
            <div class="flex items-start">
              <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500 dark:text-blue-400"></i>
              <div>
                <p><strong>Note:</strong> Location codes follow the pattern {type}-{number} (e.g., room-101, floor-1).</p>
                <p class="mt-1">The location path reflects the hierarchical structure. For a location without a parent, the path is the same as the code.</p>
                <p class="mt-1">For a location with a parent, the path will be the parent's path followed by this location's code (e.g., floor-1/north-wing/room-101).</p>
                <p class="mt-1">Metadata can be used to store additional custom attributes as a JSON object.</p>
              </div>
            </div>
          </div>
        </EntityForm>
      </div>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
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

const route = useRoute()
const toast = useToast()

// Use the location form composable in create mode
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
  updateCode,
  updatePath,
  getEdgeName,
  getEdgeCode,
  getParentDisplay,
  submitForm,
  resetForm
} = useLocationForm('create')

// Initialize the form when component is mounted
onMounted(async () => {
  // Reset form to ensure clean state
  resetForm()
  
  // Fetch edges and potential parent locations in parallel
  await Promise.all([
    fetchEdges(),
    fetchPotentialParents()
  ])
  
  // Set edge_id if provided as a query param
  if (route.query.edge_id) {
    location.value.edge_id = route.query.edge_id
  }
  
  // Set parent_id if provided as a query param
  if (route.query.parent_id) {
    location.value.parent_id = route.query.parent_id
    // Update path after parent is set
    updatePath()
  }
})
</script>

<style scoped>
/* Theme-aware styling */
.location-create-container {
  margin-bottom: 2rem;
}

.form-input {
  transition: all 0.2s ease;
}

.code-field {
  font-family: monospace;
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
