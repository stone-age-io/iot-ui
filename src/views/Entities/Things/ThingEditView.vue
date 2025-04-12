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
          :loading="loading"
          submit-label="Save Changes"
          @submit="submitForm"
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

// Get thing type options and fetch function
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

// Initial loading state
const initialLoading = ref(true)

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
  } catch (error) {
    console.error('Error loading thing data:', error)
  } finally {
    initialLoading.value = false
  }
})
</script>
