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
        Failed to load edge
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Edge Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Edge" 
        :subtitle="`Updating ${edge.code}`"
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
          title="Edge Information"
          :loading="saving"
          submit-label="Save Changes"
          @submit="handleSubmit"
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
                v-model="edge.code"
                class="w-full font-mono"
                readonly
                disabled
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
                v-model="edge.name"
                placeholder="Main Office Building"
                class="w-full"
                :class="{ 'p-invalid': v$.name.$error }"
              />
            </FormField>
            
            <!-- Type -->
            <FormField
              id="type"
              label="Type"
              hint="Read-only after creation"
            >
              <Dropdown
                id="type"
                v-model="edge.type"
                :options="edgeTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Edge Type"
                class="w-full"
                disabled
              />
            </FormField>
            
            <!-- Region -->
            <FormField
              id="region"
              label="Region"
              hint="Read-only after creation"
            >
              <Dropdown
                id="region"
                v-model="edge.region"
                :options="edgeRegions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Region"
                class="w-full"
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
                v-model="edge.description"
                rows="3"
                placeholder="Enter a description for this edge installation"
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
                  v-model="edge.active"
                  class="mr-2"
                />
                <label for="active" class="cursor-pointer">
                  {{ edge.active ? 'Active' : 'Inactive' }}
                </label>
              </div>
            </FormField>
          </div>
          
          <!-- Edit notes -->
          <div class="mt-6 bg-gray-50 p-4 rounded-md text-gray-600 text-sm">
            <div class="flex items-start">
              <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500"></i>
              <div>
                <p><strong>Note:</strong> The edge code, type, and region cannot be changed after creation.</p>
                <p class="mt-1">If you need to change these values, please create a new edge and delete this one.</p>
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
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, helpers } from '@vuelidate/validators'
import { edgeService, edgeRegions, edgeTypes } from '../../../services/edge'

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

// Edge form data
const edge = ref({
  id: '',
  code: '',
  type: '',
  region: '',
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
    minLength: helpers.withMessage(
      'Name must be at least 3 characters', 
      minLength(3)
    )
  },
  description: {}
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, edge)

// Fetch edge data on component mount
onMounted(async () => {
  await fetchEdge()
})

// Methods
const fetchEdge = async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Invalid edge ID'
    initialLoading.value = false
    return
  }
  
  initialLoading.value = true
  error.value = null
  
  try {
    const response = await edgeService.getEdge(id)
    
    // Set form data
    edge.value = {
      id: response.data.id,
      code: response.data.code,
      type: response.data.type,
      region: response.data.region,
      name: response.data.name,
      description: response.data.description,
      active: response.data.active
    }
  } catch (err) {
    console.error('Error fetching edge:', err)
    error.value = 'Failed to load edge details. Please try again.'
  } finally {
    initialLoading.value = false
  }
}

// Form submission
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  saving.value = true
  
  try {
    // Prepare data for API
    const edgeData = {
      name: edge.value.name,
      description: edge.value.description,
      active: edge.value.active
    }
    
    // Submit to API
    await edgeService.updateEdge(edge.value.id, edgeData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Edge ${edge.value.code} has been updated`,
      life: 3000
    })
    
    // Navigate back to edge detail view
    router.push({ 
      name: 'edge-detail', 
      params: { id: edge.value.id } 
    })
  } catch (error) {
    console.error('Error updating edge:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update edge. Please try again.',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}
</script>
