<template>
  <div>
    <PageHeader 
      title="Create Thing Type" 
      subtitle="Add a new thing type definition"
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
        title="Thing Type Information"
        :loading="loading"
        submit-label="Create Thing Type"
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
              placeholder="Temperature Sensor"
              class="w-full"
              :class="{ 'p-invalid': v$.type.$error }"
              @blur="generateCode"
            />
          </FormField>
          
          <!-- Code -->
          <FormField
            id="code"
            label="Code"
            :required="true"
            :error-message="v$.code.$errors[0]?.$message"
            help-text="Short code used in thing identifiers (e.g., 'temperature-sensor')"
          >
            <InputText
              id="code"
              v-model="type.code"
              placeholder="temperature-sensor"
              class="w-full font-mono"
              :class="{ 'p-invalid': v$.code.$error }"
              @input="updateAbbreviation"
            />
          </FormField>
          
          <!-- Abbreviation Preview -->
          <FormField
            id="abbreviation"
            label="Abbreviation"
            help-text="Short code used in thing identifiers"
          >
            <div class="flex items-center">
              <span class="text-sm font-mono bg-blue-50 px-2 py-1 rounded">
                {{ getTypeAbbreviation(type.code || '') }}
              </span>
            </div>
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
              placeholder="Enter a description for this thing type"
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
                :class="getTypeClass(type.code || 'default')" 
                class="px-3 py-1 rounded-full text-sm"
              >
                {{ type.type || 'Thing Type' }}
              </span>
            </div>
          </FormField>
        </div>
        
        <!-- Form guidance -->
        <div class="mt-6 bg-gray-50 p-4 rounded-md text-gray-600 text-sm">
          <div class="flex items-start">
            <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500"></i>
            <div>
              <p><strong>Note:</strong> The code should be a kebab-case identifier (lowercase with hyphens) that will be used in thing codes.</p>
              <p class="mt-1">Example: 'temperature-sensor', 'motion-sensor', 'camera', etc.</p>
              <p class="mt-1">The abbreviation will be automatically generated from the code and used in thing identifiers.</p>
            </div>
          </div>
        </div>
      </EntityForm>
    </div>
    
    <!-- Code Example -->
    <div class="card mt-6">
      <h2 class="text-xl font-semibold mb-4">Code Example</h2>
      <p class="text-gray-600 mb-3">
        This is an example of how this thing type's code will be used to generate thing codes:
      </p>
      
      <div class="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono">
        <div class="text-gray-700">// Example thing code structure</div>
        <div class="mt-2">
          <span class="text-blue-600">{{ getTypeAbbreviation(type.code || 'type') }}</span>
          <span class="text-gray-500">-location_identifier-001</span>
        </div>
        <div class="mt-2 text-gray-700">// e.g., {{ getTypeAbbreviation(type.code || 'type') }}-main-001</div>
      </div>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useThingType } from '../../../composables/useThingType'
import { useTypeForm } from '../../../composables/useTypeForm'
import { thingTypeService } from '../../../services'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

// Get thing type validation function and style class helper
const { validateCode, getTypeAbbreviation, getTypeClass } = useThingType()

// Route names for navigation
const routeNames = {
  list: 'thing-types',
  detail: 'thing-type-detail',
  create: 'create-thing-type', 
  edit: 'edit-thing-type'
}

// Use the type form composable
const { 
  type, 
  v$, 
  loading, 
  generateCode,
  submitForm 
} = useTypeForm(thingTypeService, {
  mode: 'create',
  entityName: 'Thing Type',
  routeNames,
  validateCode
})

// Force an update to the abbreviation preview when the code changes
const updateAbbreviation = () => {
  // This function is mostly a no-op as getTypeAbbreviation will be called
  // in the template with the current code value, but having this handler
  // improves reactivity
}
</script>
