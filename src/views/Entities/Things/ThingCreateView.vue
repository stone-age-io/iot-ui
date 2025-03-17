// src/views/Entities/Things/ThingCreateView.vue
<template>
  <div>
    <PageHeader 
      title="Create Thing" 
      subtitle="Add a new IoT device to your infrastructure"
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
        title="Thing Information"
        :loading="loading"
        submit-label="Create Thing"
        @submit="handleSubmit"
        @cancel="$router.back()"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Location (required) -->
          <FormField
            id="location_id"
            label="Location"
            :required="true"
            :error-message="v$.location_id.$errors[0]?.$message"
            class="md:col-span-2"
          >
            <Dropdown
              id="location_id"
              v-model="thing.location_id"
              :options="locations"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Location"
              class="w-full"
              :class="{ 'p-invalid': v$.location_id.$error }"
              :loading="locationsLoading"
              :filter="true"
              @change="updateLocationCode"
            >
              <template #option="slotProps">
                <div class="flex flex-col">
                  <div>{{ slotProps.option.name }}</div>
                  <div class="text-xs text-gray-500">{{ slotProps.option.code }}</div>
                </div>
              </template>
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex flex-col">
                  <div>
                    {{ getLocationName(slotProps.value) }}
                    <span class="text-xs text-gray-500 ml-2">{{ getLocationCode(slotProps.value) }}</span>
                  </div>
                </div>
                <span v-else>Select Location</span>
              </template>
            </Dropdown>
          </FormField>
          
          <!-- Thing Type -->
          <FormField
            id="thing_type"
            label="Type"
            :required="true"
            :error-message="v$.thing_type.$errors[0]?.$message"
          >
            <Dropdown
              id="thing_type"
              v-model="thing.thing_type"
              :options="thingTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Thing Type"
              class="w-full"
              :class="{ 'p-invalid': v$.thing_type.$error }"
              @change="updateCode"
            />
          </FormField>
          
          <!-- Sequence Number -->
          <FormField
            id="number"
            label="Number"
            :required="true"
            :error-message="v$.number.$errors[0]?.$message"
            help-text="3-digit sequence number for this thing"
          >
            <InputNumber
              id="number"
              v-model="thing.number"
              placeholder="001"
              :min="1"
              :max="999"
              class="w-full"
              :class="{ 'p-invalid': v$.number.$error }"
              @update:model-value="updateCode"
            />
          </FormField>
          
          <!-- Code (calculated field) -->
          <FormField
            id="thing_code"
            label="Code"
            :required="true"
            :error-message="v$.thing_code.$errors[0]?.$message"
            hint="Auto-generated"
          >
            <InputText
              id="thing_code"
              v-model="thing.thing_code"
              placeholder="rdr-main-001"
              class="w-full font-mono"
              :class="{ 'p-invalid': v$.thing_code.$error }"
              readonly
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
              class="w-full"
              :class="{ 'p-invalid': v$.name.$error }"
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
              v-model="thing.description"
              rows="3"
              placeholder="Enter a description for this thing"
              class="w-full"
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
              <label for="active" class="cursor-pointer">
                {{ thing.active ? 'Active' : 'Inactive' }}
              </label>
            </div>
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
  thingService, 
  thingTypes, 
  generateThingCode, 
  validateThingCode,
  getThingTypeAbbreviation
} from '../../../services/thing'
import { locationService } from '../../../services/location'

import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Load locations for the dropdown
const locations = ref([])
const locationsLoading = ref(false)
const selectedLocationCode = ref('')

// Thing form data
const thing = ref({
  location_id: route.query.location_id || '',
  thing_type: '',
  number: null,
  thing_code: '',
  name: '',
  description: '',
  active: true
})

// Loading state
const loading = ref(false)

// Form validation rules
const rules = {
  location_id: { required: helpers.withMessage('Location is required', required) },
  thing_type: { required: helpers.withMessage('Thing type is required', required) },
  number: { required: helpers.withMessage('Number is required', required) },
  thing_code: { 
    required: helpers.withMessage('Code is required', required),
    validFormat: helpers.withMessage(
      'Code must follow format: [type]-[location]-[number]', 
      (value) => validateThingCode(value)
    )
  },
  name: { 
    required: helpers.withMessage('Name is required', required)
  },
  description: {}
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, thing)

// Load locations on component mount
onMounted(async () => {
  await fetchLocations()
  
  // If location_id is provided as a query param
  if (thing.value.location_id) {
    updateLocationCode()
  }
})

// Fetch locations for dropdown
const fetchLocations = async () => {
  locationsLoading.value = true
  try {
    // If edge_id is provided as a query param, filter locations by edge
    const params = {}
    if (route.query.edge_id) {
      params.edge_id = route.query.edge_id
    }
    
    const response = await locationService.getLocations(params)
    locations.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching locations:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load locations',
      life: 3000
    })
  } finally {
    locationsLoading.value = false
  }
}

// Update selected location code when location changes
const updateLocationCode = () => {
  const location = locations.value.find(loc => loc.id === thing.value.location_id)
  if (location) {
    // Extract the identifier part from the location code
    // Format is typically level-zone-identifier
    const parts = location.code.split('-')
    selectedLocationCode.value = parts.length > 2 ? parts[2] : parts[0]
    
    // Update the thing code if all required fields are present
    updateCode()
  }
}

// Helper for displaying location name in dropdown
const getLocationName = (locationId) => {
  const location = locations.value.find(loc => loc.id === locationId)
  return location ? location.name : locationId
}

// Helper for displaying location code in dropdown
const getLocationCode = (locationId) => {
  const location = locations.value.find(loc => loc.id === locationId)
  return location ? location.code : ''
}

// Generate thing code when type, location, or number changes
const updateCode = () => {
  if (thing.value.thing_type && selectedLocationCode.value && thing.value.number) {
    const typeAbbreviation = getThingTypeAbbreviation(thing.value.thing_type)
    
    thing.value.thing_code = generateThingCode(
      typeAbbreviation,
      selectedLocationCode.value,
      thing.value.number
    )
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
    const thingData = {
      location_id: thing.value.location_id,
      thing_type: thing.value.thing_type,
      thing_code: thing.value.thing_code,
      name: thing.value.name,
      description: thing.value.description,
      active: thing.value.active
    }
    
    // Submit to API
    const response = await thingService.createThing(thingData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Thing ${thingData.thing_code} has been created`,
      life: 3000
    })
    
    // Navigate to thing detail view
    router.push({ 
      name: 'thing-detail', 
      params: { id: response.data.id } 
    })
  } catch (error) {
    console.error('Error creating thing:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create thing. Please try again.',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>
