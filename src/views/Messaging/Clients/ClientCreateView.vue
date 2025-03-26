<template>
  <div>
    <PageHeader 
      title="Create Client" 
      subtitle="Add a new NATS authentication client"
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
          <!-- Username - required field -->
          <FormField
            id="username"
            label="Username"
            :required="true"
            :error-message="v$.username.$errors[0]?.$message"
            help-text="Unique identifier for NATS authentication"
            class="md:col-span-2"
          >
            <div class="flex items-center space-x-2">
              <InputText
                id="username"
                v-model="client.username"
                placeholder="device_gateway_001"
                class="w-full font-mono"
                :class="{ 'p-invalid': v$.username.$error }"
              />
              <Button
                icon="pi pi-magic"
                class="p-button-outlined"
                @click="showGenerateUsernameDialog"
                tooltip="Generate Username"
              />
            </div>
          </FormField>
          
          <!-- Password field - required field -->
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
              <Button
                icon="pi pi-copy"
                class="ml-2"
                @click="copyPasswordToClipboard"
                tooltip="Copy Password"
              />
            </div>
            <div class="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-start">
              <i class="pi pi-exclamation-triangle mr-2 mt-0.5"></i>
              <span>Make sure to save this password securely. You won't be able to view it again after creation.</span>
            </div>
          </FormField>
          
          <!-- Role selection - required field -->
          <FormField
            id="role_id"
            label="Role"
            :required="true"
            :error-message="v$.role_id.$errors[0]?.$message"
            help-text="Permissions for this client"
            class="md:col-span-2"
          >
            <Dropdown
              id="role_id"
              v-model="client.role_id"
              :options="roles"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Role"
              class="w-full"
              :class="{ 'p-invalid': v$.role_id.$error }"
              :loading="rolesLoading"
              :filter="true"
            >
              <template #option="slotProps">
                <div>
                  <div class="font-medium">{{ slotProps.option.name }}</div>
                </div>
              </template>
            </Dropdown>
            <div class="mt-2 flex items-center">
              <Button
                label="Create New Role"
                icon="pi pi-plus"
                class="p-button-text p-button-sm"
                @click="navigateToCreateRole"
              />
            </div>
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
      </EntityForm>
    </div>
    
    <!-- Generate Username Dialog -->
    <Dialog
      v-model:visible="generateDialog.visible"
      header="Generate Username"
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div class="p-4">
        <p class="mb-4">Generate a username based on client type and descriptive name.</p>
        
        <div class="space-y-3">
          <div>
            <label for="gen-client-type" class="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
            <Dropdown
              id="gen-client-type"
              v-model="generateDialog.clientType"
              :options="clientTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Type"
              class="w-full"
            />
          </div>
          
          <div>
            <label for="gen-name" class="block text-sm font-medium text-gray-700 mb-1">Descriptive Name</label>
            <InputText
              id="gen-name"
              v-model="generateDialog.name"
              placeholder="Temperature Sensor Gateway"
              class="w-full"
            />
          </div>
          
          <div v-if="generatedUsername">
            <label class="block text-sm font-medium text-gray-700 mb-1">Generated Username</label>
            <div class="flex items-center">
              <InputText
                v-model="generatedUsername"
                class="w-full font-mono"
                readonly
              />
              <Button
                icon="pi pi-copy"
                class="p-button-text ml-2"
                @click="copyGeneratedUsername"
                tooltip="Copy"
              />
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button
          label="Generate"
          icon="pi pi-refresh"
          @click="generateUsername"
          :disabled="!generateDialog.clientType || !generateDialog.name"
        />
        <Button
          v-if="generatedUsername"
          label="Use This"
          icon="pi pi-check"
          class="ml-2"
          @click="useGeneratedUsername"
        />
        <Button
          label="Close"
          icon="pi pi-times"
          class="p-button-text ml-2"
          @click="generateDialog.visible = false"
        />
      </template>
    </Dialog>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers, minLength } from '@vuelidate/validators'
import { useClient } from '../../../composables/useClient'
import { topicPermissionService } from '../../../services'

import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'

// Use the client composable
const { 
  loading,
  error,
  generateClientUsername,
  generateSecurePassword,
  createClient,
  copyToClipboard,
  navigateToCreateRole,
  navigateToClientDetail
} = useClient()

// Roles for the dropdown
const roles = ref([])
const rolesLoading = ref(false)

// Client form data
const client = ref({
  username: '',
  password: generateSecurePassword(12),
  role_id: '',
  active: true
})

// Form validation rules
const rules = {
  username: { 
    required: helpers.withMessage('Username is required', required),
    minLength: helpers.withMessage('Username must be at least 3 characters', minLength(3))
  },
  password: { 
    required: helpers.withMessage('Password is required', required),
    minLength: helpers.withMessage('Password must be at least 8 characters', minLength(8))
  },
  role_id: { 
    required: helpers.withMessage('Role is required', required)
  }
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, client)

// Username generation dialog
const generateDialog = ref({
  visible: false,
  clientType: '',
  name: ''
})

// Client types for username generation
const clientTypes = [
  { label: 'Device', value: 'device' },
  { label: 'Service', value: 'service' },
  { label: 'User', value: 'user' },
  { label: 'Integration', value: 'integration' },
  { label: 'System', value: 'system' }
]

const generatedUsername = ref('')

// Fetch roles on component mount
onMounted(async () => {
  await fetchRoles()
})

// Fetch topic permission roles for the dropdown
const fetchRoles = async () => {
  rolesLoading.value = true
  try {
    const response = await topicPermissionService.getTopicPermissions()
    roles.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching roles:', error)
  } finally {
    rolesLoading.value = false
  }
}

// Generate a random secure password
const generateRandomPassword = () => {
  client.value.password = generateSecurePassword(12)
}

// Copy password to clipboard
const copyPasswordToClipboard = () => {
  copyToClipboard(client.value.password)
}

// Show username generation dialog
const showGenerateUsernameDialog = () => {
  generateDialog.value.visible = true
  generateDialog.value.clientType = ''
  generateDialog.value.name = ''
  generatedUsername.value = ''
}

// Generate username based on type and name
const generateUsername = () => {
  generatedUsername.value = generateClientUsername(
    generateDialog.value.clientType,
    generateDialog.value.name
  )
}

// Copy generated username to clipboard
const copyGeneratedUsername = () => {
  copyToClipboard(generatedUsername.value)
}

// Use the generated username
const useGeneratedUsername = () => {
  client.value.username = generatedUsername.value
  generateDialog.value.visible = false
}

// Form submission
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  const result = await createClient(client.value)
  
  if (result) {
    navigateToClientDetail(result.client.id)
  }
}
</script>
