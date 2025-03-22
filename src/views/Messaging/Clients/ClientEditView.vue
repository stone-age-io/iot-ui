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
        Failed to load client
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Client Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Client" 
        :subtitle="`Updating ${client.username}`"
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
          :loading="saving"
          submit-label="Save Changes"
          @submit="handleSubmit"
          @cancel="$router.back()"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Username -->
            <FormField
              id="username"
              label="Username"
              :required="true"
              :error-message="v$.username.$errors[0]?.$message"
              class="md:col-span-2"
            >
              <InputText
                id="username"
                v-model="client.username"
                class="w-full font-mono"
                :class="{ 'p-invalid': v$.username.$error }"
              />
            </FormField>
            
            <!-- Password Reset Section -->
            <FormField
              id="password_section"
              label="Password"
              help-text="Use the reset button to generate a new password"
              class="md:col-span-2"
            >
              <div class="flex items-center">
                <div class="text-gray-500 italic flex-1">
                  Password not displayed for security
                </div>
                <Button
                  label="Reset Password"
                  icon="pi pi-refresh"
                  class="p-button-outlined"
                  @click="showResetPasswordDialog"
                />
              </div>
            </FormField>
            
            <!-- Role selection -->
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
      
      <!-- Toast for success/error messages -->
      <Toast />
      
      <!-- Reset Password Dialog -->
      <Dialog 
        v-model:visible="resetPasswordDialog.visible" 
        header="Reset Password" 
        :style="{ width: '450px' }"
        :modal="true"
        :closable="!resetPasswordDialog.loading"
      >
        <div class="p-4">
          <p class="mb-4">Are you sure you want to reset the password for <strong>{{ client.username }}</strong>?</p>
          <p class="text-gray-600 text-sm mb-4">A new secure password will be generated. You will only see this password once, so make sure to copy it.</p>
          
          <div v-if="resetPasswordDialog.newPassword" class="my-4">
            <div class="text-sm text-gray-500 mb-1">New Password</div>
            <div class="flex items-center">
              <code class="bg-gray-100 p-2 rounded text-sm flex-1 font-mono">
                {{ resetPasswordDialog.newPassword }}
              </code>
              <Button 
                icon="pi pi-copy" 
                class="p-button-text ml-2" 
                @click="copyToClipboard(resetPasswordDialog.newPassword)"
                tooltip="Copy"
              />
            </div>
          </div>
        </div>
        
        <template #footer>
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            class="p-button-text" 
            @click="resetPasswordDialog.visible = false"
            :disabled="resetPasswordDialog.loading"
          />
          <Button 
            v-if="!resetPasswordDialog.newPassword"
            label="Reset Password" 
            icon="pi pi-refresh" 
            class="p-button-danger" 
            @click="resetPassword"
            :loading="resetPasswordDialog.loading"
          />
          <Button 
            v-else
            label="Done" 
            icon="pi pi-check" 
            @click="resetPasswordDialog.visible = false"
          />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers, minLength } from '@vuelidate/validators'
import { clientService, generateSecurePassword } from '../../../services/client'
import { topicPermissionService } from '../../../services/topicPermission'

import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Roles for the dropdown
const roles = ref([])
const rolesLoading = ref(false)

// Client form data - simplified to match schema
const client = ref({
  id: '',
  username: '',
  role_id: '',
  active: true
})

// Loading states
const initialLoading = ref(true)
const saving = ref(false)
const error = ref(null)

// Reset password dialog
const resetPasswordDialog = ref({
  visible: false,
  loading: false,
  newPassword: null
})

// Form validation rules
const rules = {
  username: { 
    required: helpers.withMessage('Username is required', required),
    minLength: helpers.withMessage('Username must be at least 3 characters', minLength(3))
  },
  role_id: { 
    required: helpers.withMessage('Role is required', required)
  }
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, client)

// Fetch client data and roles on component mount
onMounted(async () => {
  await Promise.all([
    fetchClient(),
    fetchRoles()
  ])
})

// Methods
const fetchClient = async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Invalid client ID'
    initialLoading.value = false
    return
  }
  
  initialLoading.value = true
  error.value = null
  
  try {
    const response = await clientService.getClient(id)
    
    // Set form data using only schema fields
    client.value = {
      id: response.data.id,
      username: response.data.username,
      role_id: response.data.role_id,
      active: response.data.active
    }
  } catch (err) {
    console.error('Error fetching client:', err)
    error.value = 'Failed to load client details. Please try again.'
  } finally {
    initialLoading.value = false
  }
}

// Fetch topic permission roles for the dropdown
const fetchRoles = async () => {
  rolesLoading.value = true
  try {
    const response = await topicPermissionService.getTopicPermissions()
    roles.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching roles:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load roles',
      life: 3000
    })
  } finally {
    rolesLoading.value = false
  }
}

// Navigate to create new role
const navigateToCreateRole = () => {
  router.push({ name: 'create-topic-permission' })
}

// Form submission
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  saving.value = true
  
  try {
    // Prepare data for API
    const clientData = {
      username: client.value.username,
      role_id: client.value.role_id,
      active: client.value.active
    }
    
    // Submit to API
    await clientService.updateClient(client.value.id, clientData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Client ${client.value.username} has been updated`,
      life: 3000
    })
    
    // Navigate back to client detail view
    router.push({ 
      name: 'client-detail', 
      params: { id: client.value.id } 
    })
  } catch (error) {
    console.error('Error updating client:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update client. Please try again.',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// Show reset password dialog
const showResetPasswordDialog = () => {
  resetPasswordDialog.value.visible = true
  resetPasswordDialog.value.newPassword = null
}

// Reset password with hashing
const resetPassword = async () => {
  resetPasswordDialog.value.loading = true
  
  try {
    // Generate new password
    const newPassword = generateSecurePassword(12)
    
    // Hash the password before sending to PocketBase
    const hashedPassword = await clientService.hashPassword(newPassword)
    
    // Update client with new hashed password
    await clientService.updateClient(client.value.id, {
      password: hashedPassword
    })
    
    // Show the PLAIN TEXT password in the dialog (this is the only time the user will see it)
    resetPasswordDialog.value.newPassword = newPassword
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Password has been reset successfully',
      life: 3000
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to reset password',
      life: 3000
    })
  } finally {
    resetPasswordDialog.value.loading = false
  }
}

// Copy text to clipboard
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      toast.add({
        severity: 'info',
        summary: 'Copied',
        detail: 'Text copied to clipboard',
        life: 2000
      })
    })
    .catch(err => {
      console.error('Failed to copy text: ', err)
    })
}
</script>
