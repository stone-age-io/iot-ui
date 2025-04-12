<!-- src/views/Entities/Locations/LocationEditView.vue -->
<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="initialLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner strokeWidth="4" />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="card p-6 text-center">
      <div class="text-red-500 text-xl mb-4">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load location
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
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
      
      <div class="card">
        <EntityForm
          title="Location Information"
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
                class="w-full font-mono"
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
                class="w-full"
                disabled
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="flex align-items-center">
                    <div>
                      {{ getEdgeName(slotProps.value) }}
                      <span class="text-xs text-gray-500 ml-2">{{ getEdgeCode(slotProps.value) }}</span>
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
                class="w-full"
                :class="{ 'p-invalid': circularReferenceError }"
                :loading="parentsLoading"
                :filter="true"
              >
                <template #option="slotProps">
                  <div class="flex align-items-center">
                    <div>
                      <div>{{ slotProps.option.name }}</div>
                      <div class="text-xs text-gray-500">{{ slotProps.option.code }}</div>
                    </div>
                  </div>
                </template>
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="flex align-items-center">
                    <div>
                      {{ getParentDisplay(slotProps.value).name }}
                      <span class="text-xs text-gray-500 ml-2">{{ getParentDisplay(slotProps.value).code }}</span>
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
                class="w-full"
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
                class="w-full"
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
                class="w-full"
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
                class="w-full"
                :class="{ 'p-invalid': validationErrors.description }"
              />
            </FormField>
          </div>
          
          <!-- Edit notes -->
          <div class="mt-6 bg-gray-50 p-4 rounded-md text-gray-600 text-sm">
            <div class="flex items-start">
              <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500"></i>
              <div>
                <p><strong>Note:</strong> The location code, level, zone, identifier, and edge cannot be changed after creation.</p>
                <p class="mt-1">If you need to change these values, please create a new location and delete this one.</p>
              </div>
            </div>
          </div>
        </EntityForm>
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
      
      // Don't show toast during initial load to avoid the error
      // toast.add({
      //   severity: 'info',
      //   summary: 'Location Loaded',
      //   detail: `Editing location ${locationData.code}`,
      //   life: 3000
      // })
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
