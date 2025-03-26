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
          :loading="loading"
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
            @click="handleResetPassword"
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
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers, minLength } from '@vuelidate/validators'
import { useClient } from '../../../composables/useClient'
import { topicPermissionService } from '../../../services'

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
const toast = useToast()

// Use the client composable
const { 
  loading,
  error,
  fetchClient,
  updateClient,
  resetPassword,
  copyToClipboard,
  navigateToCreateRole,
  navigateToClientDetail
} = useClient()

// Roles for the dropdown
const roles = ref([])
const rolesLoading = ref(false)

// Client form data
const client = ref({
  id: '',
  username: '',
  role_id: '',
  active: true
})

// Additional loading state
const initialLoading = ref(true)

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
    loadClient(),
    fetchRoles()
  ])
})

// Methods
const loadClient = async () => {
  const id = route.params.id
  initialLoading.value = true
  
  try {
    const data = await fetchClient(id)
    if (data) {
      client.value = {
        id: data.id,
        username: data.username,
        role_id: data.role_id,
        active: data.active
      }
    }
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

// Form submission
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  const result = await updateClient(client.value.id, {
    username: client.value.username,
    role_id: client.value.role_id,
    active: client.value.active
  })
  
  if (result) {
    navigateToClientDetail(client.value.id)
  }
}

// Show reset password dialog
const showResetPasswordDialog = () => {
  resetPasswordDialog.value.visible = true
  resetPasswordDialog.value.newPassword = null
}

// Reset password
const handleResetPassword = async () => {
  resetPasswordDialog.value.loading = true
  
  try {
    const newPassword = await resetPassword(client.value.id)
    if (newPassword) {
      resetPasswordDialog.value.newPassword = newPassword
    }
  } finally {
    resetPasswordDialog.value.loading = false
  }
}
</script>
