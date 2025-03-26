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
        @submit="submitForm"
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
import { onMounted } from 'vue'
import { useThing } from '../../../composables/useThing'
import { useThingForm } from '../../../composables/useThingForm'
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

// Get thing type options
const { thingTypes } = useThing()

// Use the thing form composable in create mode
const {
  thing,
  v$,
  loading,
  locations,
  locationsLoading,
  fetchLocations,
  updateLocationCode,
  updateCode,
  getLocationName,
  getLocationCode,
  submitForm
} = useThingForm('create')

// Load locations on component mount
onMounted(async () => {
  await fetchLocations()
  
  // If location_id is provided as a query param
  if (thing.value.location_id) {
    updateLocationCode()
  }
})
</script>
