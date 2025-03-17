// src/views/Entities/Things/ThingEditView.vue
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
        Failed to load thing
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Thing Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Thing" 
        :subtitle="`Updating ${thing.thing_code}`"
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
          :loading="saving"
          submit-label="Save Changes"
          @submit="handleSubmit"
          @cancel="$router.back()"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Thing Code (readonly) -->
            <FormField
              id="thing_code"
              label="Code"
              :required="true"
              hint="Not editable"
            >
              <InputText
                id="thing_code"
                v-model="thing.thing_code"
                class="w-full font-mono"
                readonly
                disabled
              />
            </FormField>
            
            <!-- Type (readonly) -->
            <FormField
              id="thing_type"
              label="Type"
              hint="Not editable after creation"
            >
              <Dropdown
                id="thing_type"
                v-model="thing.thing_type"
                :options="thingTypes"
                optionLabel="label"
                optionValue="value"
                class="w-full"
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
                class="w-full"
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
                class="w-full"
                disabled
              >
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { thingService, thingTypes } from '../../../services/thing'
import { locationService } from '../../../services/location'

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
const router = useRouter()
const toast = useToast()

// Data for locations dropdown
const locations = ref([])

// Thing form data
const thing = ref({
  id: '',
  thing_code: '',
  thing_type: '',
  location_id: '',
  name: '',
  description: '',
  active: true
})

// Loading states
const initialLoading = ref(true)
const saving = ref(false)
const error = ref(null)

// Form validation rules
const rules = {
  name: { 
    required: helpers.withMessage('Name is required', required),
  },
  description: {}
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, thing)

// Fetch thing data on component mount
onMounted(async () => {
  await fetchThing()
  await fetchLocations()
})

// Methods
const fetchThing = async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Invalid thing ID'
    initialLoading.value = false
    return
  }
  
  initialLoading.value = true
  error.value = null
  
  try {
    const response = await thingService.getThing(id)
    
    // Set form data
    thing.value = {
      id: response.data.id,
      thing_code: response.data.thing_code,
      thing_type: response.data.thing_type,
      location_id: response.data.location_id,
      name: response.data.name,
      description: response.data.description,
      active: response.data.active
    }
  } catch (err) {
    console.error('Error fetching thing:', err)
    error.value = 'Failed to load thing details. Please try again.'
  } finally {
    initialLoading.value = false
  }
}

// Fetch locations for the dropdown (even though it's disabled, we need the data for display)
const fetchLocations = async () => {
  try {
    const response = await locationService.getLocations()
    locations.value = response.data.items || []
  } catch (err) {
    console.error('Error fetching locations:', err)
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

// Form submission
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  saving.value = true
  
  try {
    // Prepare data for API
    const thingData = {
      name: thing.value.name,
      description: thing.value.description,
      active: thing.value.active
    }
    
    // Submit to API
    await thingService.updateThing(thing.value.id, thingData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Thing ${thing.value.thing_code} has been updated`,
      life: 3000
    })
    
    // Navigate back to thing detail view
    router.push({ 
      name: 'thing-detail', 
      params: { id: thing.value.id } 
    })
  } catch (error) {
    console.error('Error updating thing:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update thing. Please try again.',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}
</script>
