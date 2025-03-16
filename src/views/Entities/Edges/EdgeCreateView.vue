<template>
  <div>
    <PageHeader 
      title="Create Edge" 
      subtitle="Add a new edge installation to your infrastructure"
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
        :loading="loading"
        submit-label="Create Edge"
        @submit="handleSubmit"
        @cancel="$router.back()"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Type -->
          <FormField
            id="type"
            label="Type"
            :required="true"
            :error-message="v$.type.$errors[0]?.$message"
          >
            <Dropdown
              id="type"
              v-model="edge.type"
              :options="edgeTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Edge Type"
              class="w-full"
              :class="{ 'p-invalid': v$.type.$error }"
              @change="updateCode"
            />
          </FormField>
          
          <!-- Region -->
          <FormField
            id="region"
            label="Region"
            :required="true"
            :error-message="v$.region.$errors[0]?.$message"
          >
            <Dropdown
              id="region"
              v-model="edge.region"
              :options="edgeRegions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Region"
              class="w-full"
              :class="{ 'p-invalid': v$.region.$error }"
              @change="updateCode"
            />
          </FormField>
          
          <!-- Number -->
          <FormField
            id="number"
            label="Number"
            :required="true"
            :error-message="v$.number.$errors[0]?.$message"
            help-text="3-digit sequence number for this edge"
          >
            <InputNumber
              id="number"
              v-model="edge.number"
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
            id="code"
            label="Code"
            :required="true"
            :error-message="v$.code.$errors[0]?.$message"
            hint="Auto-generated"
          >
            <InputText
              id="code"
              v-model="edge.code"
              placeholder="bld-na-001"
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
            class="md:col-span-2"
          >
            <InputText
              id="name"
              v-model="edge.name"
              placeholder="Main Office Building"
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
      </EntityForm>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, helpers } from '@vuelidate/validators'
import { edgeService, edgeRegions, edgeTypes, generateEdgeCode, validateEdgeCode } from '../../../services/edge'

import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()

// Edge form data
const edge = ref({
  type: '',
  region: '',
  number: null,
  code: '',
  name: '',
  description: '',
  active: true
})

// Loading state
const loading = ref(false)

// Form validation rules
const rules = {
  type: { required: helpers.withMessage('Type is required', required) },
  region: { required: helpers.withMessage('Region is required', required) },
  number: { 
    required: helpers.withMessage('Number is required', required),
  },
  code: { 
    required: helpers.withMessage('Code is required', required),
    validFormat: helpers.withMessage(
      'Code must follow format: [type]-[region]-[number]', 
      (value) => validateEdgeCode(value)
    )
  },
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

// Generate edge code when type, region, or number changes
const updateCode = () => {
  if (edge.value.type && edge.value.region && edge.value.number) {
    edge.value.code = generateEdgeCode(
      edge.value.type,
      edge.value.region,
      edge.value.number
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
    const edgeData = {
      code: edge.value.code,
      type: edge.value.type,
      region: edge.value.region,
      name: edge.value.name,
      description: edge.value.description,
      active: edge.value.active
    }
    
    // Submit to API
    const response = await edgeService.createEdge(edgeData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Edge ${edgeData.code} has been created`,
      life: 3000
    })
    
    // Navigate to edge detail view
    router.push({ 
      name: 'edge-detail', 
      params: { id: response.data.id } 
    })
  } catch (error) {
    console.error('Error creating edge:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create edge. Please try again.',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>
