<template>
  <div class="thing-create-container">
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
    
    <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
      <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
        <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Thing Information</h2>
      </div>
      <div class="p-6">
        <EntityForm
          :loading="loading"
          submit-label="Create Thing"
          @submit="submitForm"
          @cancel="$router.back()"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                class="w-full form-input"
                :class="{ 'p-invalid': v$.location_id.$error }"
                :loading="locationsLoading"
                :filter="true"
                @change="updateLocationCode"
              >
                <template #option="slotProps">
                  <div class="flex flex-col">
                    <div class="text-content-primary dark:text-content-primary-dark">{{ slotProps.option.name }}</div>
                    <div class="text-xs text-content-secondary dark:text-content-secondary-dark">{{ slotProps.option.code }}</div>
                  </div>
                </template>
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
            
            <!-- Thing Type -->
            <FormField
              id="type"
              label="Type"
              :required="true"
              :error-message="v$.type.$errors[0]?.$message"
            >
              <Dropdown
                id="type"
                v-model="thing.type"
                :options="thingTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Thing Type"
                class="w-full form-input"
                :class="{ 'p-invalid': v$.type.$error }"
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
                class="w-full form-input"
                :class="{ 'p-invalid': v$.number.$error }"
                @update:model-value="updateCode"
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
                v-model="thing.code"
                placeholder="rdr-main-001"
                class="w-full font-mono form-input code-field"
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
        </EntityForm>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
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

const route = useRoute()

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
  if (route.query.location_id) {
    thing.value.location_id = route.query.location_id
    updateLocationCode()
  }
})
</script>

<style scoped>
/* Theme-aware styling */
.thing-create-container {
  margin-bottom: 2rem;
}

.form-input {
  transition: all 0.2s ease;
}

.code-field {
  font-family: monospace;
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
