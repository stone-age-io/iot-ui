<template>
  <div class="edge-edit-container">
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
        Failed to load edge
      </div>
      <p :class="['mb-4', textColor.secondary]">{{ error }}</p>
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
      
      <Card>
        <template #title>
          <h2 :class="['text-xl font-semibold', textColor.primary]">Edge Information</h2>
        </template>
        <template #content>
          <EntityForm
            :loading="loading"
            submit-label="Save Changes"
            @submit="submitForm"
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
                    class="cursor-pointer"
                    :class="textColor.primary"
                  >
                    {{ edge.active ? 'Active' : 'Inactive' }}
                  </label>
                </div>
              </FormField>
            </div>
            
            <!-- Edit notes -->
            <div class="mt-6 info-panel">
              <div class="flex items-start">
                <i :class="['pi pi-info-circle mt-0.5 mr-2', themeValue.class('text-blue-500', 'text-blue-400')]"></i>
                <div>
                  <p><strong>Note:</strong> The edge code, type, and region cannot be changed after creation.</p>
                  <p class="mt-1">If you need to change these values, please create a new edge and delete this one.</p>
                </div>
              </div>
            </div>
          </EntityForm>
        </template>
      </Card>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEdge } from '../../../composables/useEdge'
import { useEdgeForm } from '../../../composables/useEdgeForm'
import { useTheme } from '../../../composables/useTheme'
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

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor } = useTheme()

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
  submitForm 
} = useEdgeForm('edit')

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

:deep(.p-card .p-card-title) {
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
</style>
