// src/views/Entities/Locations/LocationCreateView.vue
<template>
  <div>
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
    
    <div class="card">
      <EntityForm
        title="Location Information"
        :loading="loading"
        submit-label="Create Location"
        @submit="handleSubmit"
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
              class="w-full"
              :class="{ 'p-invalid': v$.edge_id.$error }"
              :loading="edgesLoading"
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
                    {{ getEdgeName(slotProps.value) }}
                    <span class="text-xs text-gray-500 ml-2">{{ getEdgeCode(slotProps.value) }}</span>
                  </div>
                </div>
                <span v-else>Select Edge</span>
              </template>
            </Dropdown>
          </FormField>
          
          <!-- Level -->
          <FormField
            id="level"
            label="Level"
            :required="true"
            :error-message="v$.level.$errors[0]?.$message"
          >
            <Dropdown
              id="level"
              v-model="location.level"
              :options="locationLevels"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Level"
              class="w-full"
              :class="{ 'p-invalid': v$.level.$error }"
              @change="updateCode"
            />
          </FormField>
          
          <!-- Zone -->
          <FormField
            id="zone"
            label="Zone"
            :required="true"
            :error-message="v$.zone.$errors[0]?.$message"
          >
            <Dropdown
              id="zone"
              v-model="location.zone"
              :options="locationZones"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Zone"
              class="w-full"
              :class="{ 'p-invalid': v$.zone.$error }"
              @change="updateCode"
            />
          </FormField>
          
          <!-- Identifier -->
          <FormField
            id="identifier"
            label="Identifier"
            :required="true"
            :error-message="v$.identifier.$errors[0]?.$message"
            help-text="Unique identifier within this level and zone"
          >
            <InputText
              id="identifier"
              v-model="location.identifier"
              placeholder="reception"
              class="w-full"
              :class="{ 'p-invalid': v$.identifier.$error }"
              @input="updateCode"
            />
          </FormField>
          
          <!-- Code (calculated field) -->
          <FormField
            id="code"
            label="Code"
            :required="true"
            :error-message="v$.code.$errors[0]?.$message"
            hint="Auto-generated"
          >
            <InputText
              id="code"
              v-model="location.code"
              placeholder="floor-1-north-reception"
              class="w-full font-mono"
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
              class="w-full"
              :class="{ 'p-invalid': v$.name.$error }"
            />
          </FormField>
          
          <!-- Type -->
          <FormField
            id="type"
            label="Type"
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
              class="w-full"
              :class="{ 'p-invalid': v$.type.$error }"
            />
          </FormField>
          
          <!-- Path -->
          <FormField
            id="path"
            label="Path"
            :required="true"
            :error-message="v$.path.$errors[0]?.$message"
            class="md:col-span-2"
          >
            <InputText
              id="path"
              v-model="location.path"
              placeholder="floor-1/north-wing/reception"
              class="w-full"
              :class="{ 'p-invalid': v$.path.$error }"
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
              class="w-full"
              :class="{ 'p-invalid': v$.description.$error }"
            />
          </FormField>
        </div>
      </EntityForm>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { 
  locationService, 
  locationTypes, 
  locationLevels, 
  locationZones, 
  generateLocationCode, 
  validateLocationCode 
} from '../../../services/location'
import { edgeService } from '../../../services/edge'

import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Load edges for the dropdown
const edges = ref([])
const edgesLoading = ref(false)

// Location form data
const location = ref({
  edge_id: route.query.edge_id || '',
  level: '',
  zone: '',
  identifier: '',
  code: '',
  name: '',
  type: '',
  path: '',
  description: ''
})

// Loading state
const loading = ref(false)

// Form validation rules
const rules = {
  edge_id: { required: helpers.withMessage('Edge is required', required) },
  level: { required: helpers.withMessage('Level is required', required) },
  zone: { required: helpers.withMessage('Zone is required', required) },
  identifier: { required: helpers.withMessage('Identifier is required', required) },
  code: { 
    required: helpers.withMessage('Code is required', required),
    validFormat: helpers.withMessage(
      'Code must follow format: [level]-[zone]-[identifier]', 
      (value) => validateLocationCode(value)
    )
  },
  name: { 
    required: helpers.withMessage('Name is required', required)
  },
  type: { 
    required: helpers.withMessage('Type is required', required)
  },
  path: { 
    required: helpers.withMessage('Path is required', required)
  },
  description: {}
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, location)

// Load edges on component mount
onMounted(async () => {
  await fetchEdges()
  
  // If edge_id is provided as a query param, update the path when it changes
  if (location.value.edge_id) {
    updatePathFromLevelZone()
  }
})

// Fetch edges for dropdown
const fetchEdges = async () => {
  edgesLoading.value = true
  try {
    const response = await edgeService.getEdges()
    edges.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching edges:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load edges',
      life: 3000
    })
  } finally {
    edgesLoading.value = false
  }
}

// Helper for displaying edge name in dropdown
const getEdgeName = (edgeId) => {
  const edge = edges.value.find(edge => edge.id === edgeId)
  return edge ? edge.name : edgeId
}

// Helper for displaying edge code in dropdown
const getEdgeCode = (edgeId) => {
  const edge = edges.value.find(edge => edge.id === edgeId)
  return edge ? edge.code : ''
}

// Generate location code when level, zone, or identifier changes
const updateCode = () => {
  if (location.value.level && location.value.zone && location.value.identifier) {
    location.value.code = generateLocationCode(
      location.value.level,
      location.value.zone,
      location.value.identifier
    )
    
    // Also update the path
    updatePathFromLevelZone()
  }
}

// Update path based on level, zone, and identifier
const updatePathFromLevelZone = () => {
  if (location.value.level && location.value.zone && location.value.identifier) {
    // Basic path structure: level/zone/identifier
    location.value.path = `${location.value.level}/${location.value.zone}/${location.value.identifier}`
  }
}

// Form submission
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  loading.value = true
  
  try {
    // Prepare data for API
    const locationData = {
      edge_id: location.value.edge_id,
      code: location.value.code,
      name: location.value.name,
      type: location.value.type,
      path: location.value.path,
      description: location.value.description
    }
    
    // Submit to API
    const response = await locationService.createLocation(locationData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Location ${locationData.code} has been created`,
      life: 3000
    })
    
    // Navigate to location detail view
    router.push({ 
      name: 'location-detail', 
      params: { id: response.data.id } 
    })
  } catch (error) {
    console.error('Error creating location:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create location. Please try again.',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>
