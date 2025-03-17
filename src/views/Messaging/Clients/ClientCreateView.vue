<template>
  <div>
    <PageHeader 
      title="Create Client" 
      subtitle="Add a new messaging client for device or service access"
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
        title="Client Information"
        :loading="loading"
        submit-label="Create Client"
        @submit="handleSubmit"
        @cancel="$router.back()"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Client Type -->
          <FormField
            id="client_type"
            label="Type"
            :required="true"
            :error-message="v$.client_type.$errors[0]?.$message"
            help-text="Type of client accessing the messaging system"
          >
            <Dropdown
              id="client_type"
              v-model="client.client_type"
              :options="clientTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Client Type"
              class="w-full"
              :class="{ 'p-invalid': v$.client_type.$error }"
              @change="updateUsername"
            />
          </FormField>
          
          <!-- Access Level -->
          <FormField
            id="access_level"
            label="Access Level"
            :required="true"
            :error-message="v$.access_level.$errors[0]?.$message"
            help-text="Default access rights for the client"
          >
            <Dropdown
              id="access_level"
              v-model="client.access_level"
              :options="accessLevels"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Access Level"
              class="w-full"
              :class="{ 'p-invalid': v$.access_level.$error }"
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
              v-model="client.name"
              placeholder="Sensor Gateway"
              class="w-full"
              :class="{ 'p-invalid': v$.name.$error }"
              @input="updateUsername"
            />
          </FormField>
          
          <!-- Username -->
          <FormField
            id="username"
            label="Username"
            :required="true"
            :error-message="v$.username.$errors[0]?.$message"
            hint="Auto-generated but can be modified"
          >
            <InputText
              id="username"
              v-model="client.username"
              placeholder="dev_sensor_gateway"
              class="w-full font-mono"
              :class="{ 'p-invalid': v$.username.$error }"
            />
          </FormField>
          
          <!-- Password -->
          <FormField
            id="password"
            label="Password"
            :required="true"
            :error-message="v$.password.$errors[0]?.$message"
            help-text="You can view this password only during creation"
          >
            <div class="flex">
              <Password
                id="password"
                v-model="client.password"
                :feedback="false"
                toggleMask
                inputClass="w-full"
                class="w-full"
                :class="{ 'p-invalid': v$.password.$error }"
              />
              <Button
                icon="pi pi-refresh"
                class="ml-2"
                @click="generateRandomPassword"
                tooltip="Generate Password"
              />
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
              v-model="client.description"
              rows="3"
              placeholder="Enter a description for this client"
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
                v-model="client.active"
                class="mr-2"
              />
              <label for="active" class="cursor-pointer">
                {{ client.active ? 'Active' : 'Inactive' }}
              </label>
            </div>
          </FormField>
        </div>
        
        <!-- Topic Permissions Section -->
        <div class="mt-8">
          <h3 class="text-lg font-semibold mb-4">Topic Permissions</h3>
          <p class="text-gray-600 mb-4">
            You can add topic permissions for this client after creation. By default, the client will have
            the access level specified above for all topics it is explicitly granted access to.
          </p>
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
import { required, helpers, minLength } from '@vuelidate/validators'
import { 
  clientService, 
  clientTypes, 
  accessLevels, 
  generateClientUsername,
  generateSecurePassword
} from '../../../services/client'

import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()

// Client form data
const client = ref({
  client_type: '',
  access_level: 'read',
  name: '',
  username: '',
  password: generateSecurePassword(12),
  description: '',
  active: true
})

// Loading state
const loading = ref(false)

// Form validation rules
const rules = {
  client_type: { required: helpers.withMessage('Client type is required', required) },
  access_level: { required: helpers.withMessage('Access level is required', required) },
  name: { 
    required: helpers.withMessage('Name is required', required),
    minLength: helpers.withMessage('Name must be at least 3 characters', minLength(3))
  },
  username: { 
    required: helpers.withMessage('Username is required', required),
    minLength: helpers.withMessage('Username must be at least 3 characters', minLength(3))
  },
  password: { 
    required: helpers.withMessage('Password is required', required),
    minLength: helpers.withMessage('Password must be at least 8 characters', minLength(8))
  },
  description: {}
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, client)

// Generate client username based on type and name
const updateUsername = () => {
  if (client.value.client_type && client.value.name) {
    client.value.username = generateClientUsername(
      client.value.client_type,
      client.value.name
    )
  }
}

// Generate a random secure password
const generateRandomPassword = () => {
  client.value.password = generateSecurePassword(12)
}

// Form submission
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  loading.value = true
  
  try {
    // Prepare data for API
    const clientData = {
      client_type: client.value.client_type,
      access_level: client.value.access_level,
      name: client.value.name,
      username: client.value.username,
      password: client.value.password,
      description: client.value.description,
      active: client.value.active
    }
    
    // Submit to API
    const response = await clientService.createClient(clientData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Client ${clientData.username} has been created`,
      life: 3000
    })
    
    // Navigate to client detail view
    router.push({ 
      name: 'client-detail', 
      params: { id: response.data.id } 
    })
  } catch (error) {
    console.error('Error creating client:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create client. Please try again.',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>
