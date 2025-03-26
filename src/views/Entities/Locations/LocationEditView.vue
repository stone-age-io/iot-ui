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
              />
            </FormField>
            
            <!-- Name -->
            <FormField
              id="name"
              label="Name"
              :required="true"
              :error-message="v$.name && v$.name.$errors.length ? v$.name.$errors[0].$message : ''"
            >
              <InputText
                id="name"
                v-model="location.name"
                placeholder="North Reception Area"
                class="w-full"
                :class="{ 'p-invalid': v$.name && v$.name.$error }"
              />
            </FormField>
            
            <!-- Type -->
            <FormField
              id="type"
              label="Type"
              :required="true"
              :error-message="v$.type && v$.type.$errors.length ? v$.type.$errors[0].$message : ''"
            >
              <Dropdown
                id="type"
                v-model="location.type"
                :options="locationTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Type"
                class="w-full"
                :class="{ 'p-invalid': v$.type && v$.type.$error }"
              />
            </FormField>
            
            <!-- Path -->
            <FormField
              id="path"
              label="Path"
              :required="true"
              :error-message="v$.path && v$.path.$errors.length ? v$.path.$errors[0].$message : ''"
              class="md:col-span-2"
            >
              <InputText
                id="path"
                v-model="location.path"
                placeholder="floor-1/north-wing/reception"
                class="w-full"
                :class="{ 'p-invalid': v$.path && v$.path.$error }"
              />
            </FormField>
            
            <!-- Description -->
            <FormField
              id="description"
              label="Description"
              :error-message="v$.description && v$.description.$errors.length ? v$.description.$errors[0].$message : ''"
              class="md:col-span-2"
            >
              <Textarea
                id="description"
                v-model="location.description"
                rows="3"
                placeholder="Enter a description for this location"
                class="w-full"
                :class="{ 'p-invalid': v$.description && v$.description.$error }"
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLocation } from '../../../composables/useLocation'
import { useLocationForm } from '../../../composables/useLocationForm'
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

// Get location functionality and error handling from location composable
const { error: locationError, fetchLocation } = useLocation()

// Use the location form composable in edit mode
const { 
  location, 
  v$, 
  loading, 
  edges,
  edgesLoading,
  locationTypes,
  fetchEdges,
  loadLocation,
  submitForm
} = useLocationForm('edit')

// Local state
const initialLoading = ref(true)
const error = ref(null)

// Fetch location data on component mount
onMounted(async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Location ID is missing'
    initialLoading.value = false
    return
  }
  
  try {
    // Fetch edges first, needed for the dropdown
    await fetchEdges()
    
    // Fetch location data
    const locationData = await fetchLocation(id)
    
    // Load data into form
    if (locationData) {
      loadLocation(locationData)
    } else {
      error.value = 'Location not found'
    }
  } catch (err) {
    error.value = locationError.value || 'Failed to load location data'
    console.error('Error in LocationEditView:', err)
  } finally {
    initialLoading.value = false
  }
})
</script>
