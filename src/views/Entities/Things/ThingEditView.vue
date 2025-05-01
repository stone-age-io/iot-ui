<template>
  <div class="thing-edit-container">
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
        Failed to load thing
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Thing Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Thing" 
        :subtitle="`Updating ${thing.code}`"
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
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Thing Information</h2>
        </div>
        <div class="p-6">
          <EntityForm
            :loading="loading"
            submit-label="Save Changes"
            @submit="submitForm"
            @cancel="$router.back()"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Thing Code (readonly) -->
              <FormField
                id="code"
                label="Code"
                :required="true"
                hint="Not editable"
              >
                <InputText
                  id="code"
                  v-model="thing.code"
                  class="w-full font-mono form-input disabled-field"
                  readonly
                  disabled
                />
              </FormField>
              
              <!-- Type (readonly) -->
              <FormField
                id="type"
                label="Type"
                hint="Not editable after creation"
              >
                <Dropdown
                  id="type"
                  v-model="thing.type"
                  :options="thingTypes"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full form-input disabled-field"
                  disabled
                />
              </FormField>
              
              <!-- Name -->
              <FormField
                id="name"
                label="Name"
                :required="true"
                :error-message="v$.name.$errors[0]?.$message"
                class="md:col-span-2"
              >
                <InputText
                  id="name"
                  v-model="thing.name"
                  placeholder="Main Entrance Reader"
                  class="w-full form-input"
                  :class="{ 'p-invalid': v$.name.$error }"
                />
              </FormField>
              
              <!-- Location (readonly) -->
              <FormField
                id="location_id"
                label="Location"
                hint="Not editable after creation"
                class="md:col-span-2"
              >
                <Dropdown
                  id="location_id"
                  v-model="thing.location_id"
                  :options="locations"
                  optionLabel="name"
                  optionValue="id"
                  class="w-full form-input disabled-field"
                  disabled
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex flex-col">
                      <div class="text-content-primary dark:text-content-primary-dark">
                        {{ getLocationName(slotProps.value) }}
                        <span class="text-xs ml-2 text-content-secondary dark:text-content-secondary-dark">{{ getLocationCode(slotProps.value) }}</span>
                      </div>
                    </div>
                    <span v-else class="text-content-secondary dark:text-content-secondary-dark">Select Location</span>
                  </template>
                </Dropdown>
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
                  v-model="thing.description"
                  rows="3"
                  placeholder="Enter a description for this thing"
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
                    v-model="thing.active"
                    class="mr-2"
                  />
                  <label 
                    for="active" 
                    class="cursor-pointer text-content-primary dark:text-content-primary-dark"
                  >
                    {{ thing.active ? 'Active' : 'Inactive' }}
                  </label>
                </div>
              </FormField>
            </div>
            
            <!-- Edit notes -->
            <div class="mt-6 p-4 rounded-lg border border-border-light dark:border-border-light-dark bg-surface-secondary dark:bg-surface-secondary-dark theme-transition">
              <div class="flex items-start">
                <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500 dark:text-blue-400"></i>
                <div>
                  <p class="font-medium text-content-primary dark:text-content-primary-dark"><strong>Note:</strong> The thing code, type, and location cannot be changed after creation.</p>
                  <p class="mt-1 text-content-secondary dark:text-content-secondary-dark">If you need to change these values, please create a new thing and delete this one.</p>
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThing } from '../../../composables/useThing'
import { useThingForm } from '../../../composables/useThingForm'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()

// Initial loading state
const initialLoading = ref(true)

// Get thing functionality from composable
const { thingTypes, fetchThing, error } = useThing()

// Use the thing form composable in edit mode
const { 
  thing, 
  v$, 
  loading, 
  locations,
  locationsLoading,
  fetchLocations,
  loadThing,
  getLocationName,
  getLocationCode,
  submitForm 
} = useThingForm('edit')

// Fetch thing data on component mount
onMounted(async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch locations for dropdown
    await fetchLocations()
    
    // Fetch thing data
    const thingData = await fetchThing(id)
    
    // Load data into form
    if (thingData) {
      loadThing(thingData)
    }
  } catch (err) {
    console.error('Error loading thing data:', err)
  } finally {
    initialLoading.value = false
  }
})
</script>

<style scoped>
/* Theme-aware styling */
.thing-edit-container {
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
