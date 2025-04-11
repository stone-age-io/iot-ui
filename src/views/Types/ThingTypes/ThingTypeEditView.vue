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
        Failed to load thing type
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Thing Type Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Thing Type" 
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
          title="Thing Type Information"
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
                placeholder="Temperature Sensor"
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
            
            <!-- Abbreviation Preview -->
            <FormField
              id="abbreviation"
              label="Abbreviation"
              hint="Used in thing identifiers"
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
                <p><strong>Note:</strong> The thing type code cannot be changed after creation as it may be used by existing things.</p>
                <p class="mt-1">If you need to use a different code, please create a new thing type and update your things accordingly.</p>
              </div>
            </div>
          </div>
        </EntityForm>
      </div>
      
      <!-- Code Example -->
      <div class="card mt-6">
        <h2 class="text-xl font-semibold mb-4">Code Example</h2>
        <p class="text-gray-600 mb-3">
          This is an example of how this thing type's code is used to generate thing codes:
        </p>
        
        <div class="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono">
          <div class="text-gray-700">// Example thing code structure</div>
          <div class="mt-2">
            <span class="text-blue-600">{{ getTypeAbbreviation(type.code) }}</span>
            <span class="text-gray-500">-location_identifier-001</span>
          </div>
          <div class="mt-2 text-gray-700">// e.g., {{ getTypeAbbreviation(type.code) }}-main-001</div>
        </div>
      </div>
      
      <!-- Toast for success/error messages -->
      <Toast />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
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
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()

// Route names for navigation
const routeNames = {
  list: 'thing-types',
  detail: 'thing-type-detail',
  create: 'create-thing-type', 
  edit: 'edit-thing-type'
}

// Get thing type functionality
const { fetchType, error, getTypeAbbreviation, getTypeClass } = useThingType()

// Use the type form composable in edit mode
const { 
  type, 
  v$, 
  loading, 
  loadType,
  submitForm 
} = useTypeForm(thingTypeService, {
  mode: 'edit',
  entityName: 'Thing Type',
  routeNames
})

// Initial loading state
const initialLoading = ref(true)

// Fetch thing type data on component mount
onMounted(async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch thing type data
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
