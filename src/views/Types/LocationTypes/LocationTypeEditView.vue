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
        Failed to load location type
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Location Type Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Location Type" 
        :subtitle="`Updating ${type.type}`"
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
          title="Location Type Information"
          :loading="loading"
          submit-label="Save Changes"
          @submit="submitForm"
          @cancel="$router.back()"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Type Name -->
            <FormField
              id="type"
              label="Type Name"
              :required="true"
              :error-message="v$.type.$errors[0]?.$message"
              class="md:col-span-2"
            >
              <InputText
                id="type"
                v-model="type.type"
                placeholder="Meeting Room"
                class="w-full"
                :class="{ 'p-invalid': v$.type.$error }"
              />
            </FormField>
            
            <!-- Code (read-only) -->
            <FormField
              id="code"
              label="Code"
              hint="Not editable after creation"
            >
              <InputText
                id="code"
                v-model="type.code"
                class="w-full font-mono"
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
                v-model="type.description"
                rows="3"
                placeholder="Enter a description for this location type"
                class="w-full"
                :class="{ 'p-invalid': v$.description.$error }"
              />
            </FormField>

            <!-- Style Preview -->
            <FormField
              id="style-preview"
              label="Style Preview"
              class="md:col-span-2"
            >
              <div class="flex items-center mt-2">
                <span 
                  :class="getTypeClass(type.code)" 
                  class="px-3 py-1 rounded-full text-sm"
                >
                  {{ type.type }}
                </span>
              </div>
            </FormField>
          </div>
          
          <!-- Edit notes -->
          <div class="mt-6 bg-gray-50 p-4 rounded-md text-gray-600 text-sm">
            <div class="flex items-start">
              <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500"></i>
              <div>
                <p><strong>Note:</strong> The location type code cannot be changed after creation as it may be used by existing locations.</p>
                <p class="mt-1">If you need to use a different code, please create a new location type and update your locations accordingly.</p>
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
import { useLocationType } from '../../../composables/useLocationType'
import { useTypeForm } from '../../../composables/useTypeForm'
import { locationTypeService } from '../../../services'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()

// Route names for navigation
const routeNames = {
  list: 'location-types',
  detail: 'location-type-detail',
  create: 'create-location-type', 
  edit: 'edit-location-type'
}

// Get location type functionality
const { fetchType, error, getTypeClass } = useLocationType()

// Use the type form composable in edit mode
const { 
  type, 
  v$, 
  loading, 
  loadType,
  submitForm 
} = useTypeForm(locationTypeService, {
  mode: 'edit',
  entityName: 'Location Type',
  routeNames
})

// Initial loading state
const initialLoading = ref(true)

// Fetch location type data on component mount
onMounted(async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch location type data
    const typeData = await fetchType(id)
    
    // Load data into form
    if (typeData) {
      loadType(typeData)
    }
  } finally {
    initialLoading.value = false
  }
})
</script>
