<!-- src/views/Messaging/Clients/ClientEditView.vue -->
<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="initialLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner 
        strokeWidth="4" 
        class="text-primary-500 dark:text-primary-400" 
      />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="p-6 text-center bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark rounded-lg shadow-theme-md">
      <div class="text-xl mb-4 text-red-600 dark:text-red-400">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load client
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
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
      
      <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
        <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Client Information</h2>
        </div>
        <div class="p-6">
          <EntityForm
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
                  class="w-full font-mono form-input"
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
                  <div class="italic flex-1 text-content-secondary dark:text-content-secondary-dark">
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
                  class="w-full form-input"
                  :class="{ 'p-invalid': v$.role_id.$error }"
                  :loading="rolesLoading"
                  :filter="true"
                >
                  <template #option="slotProps">
                    <div>
                      <div class="font-medium text-content-primary dark:text-content-primary-dark">{{ slotProps.option.name }}</div>
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
                  <label 
                    for="active" 
                    class="cursor-pointer text-content-primary dark:text-content-primary-dark"
                  >
                    {{ client.active ? 'Active' : 'Inactive' }}
                  </label>
                </div>
              </FormField>
            </div>
          </EntityForm>
        </div>
      </div>
      
      <!-- Reset Password Dialog -->
      <Dialog 
        v-model:visible="resetPasswordDialog.visible" 
        header="Reset Password" 
        :style="{ width: '450px' }"
        :modal="true"
        :closable="!resetPasswordDialog.loading"
      >
        <div class="p-4">
          <p class="mb-4 text-content-primary dark:text-content-primary-dark">Are you sure you want to reset the password for <strong>{{ client.username }}</strong>?</p>
          <p class="text-sm mb-4 text-content-secondary dark:text-content-secondary-dark">A new secure password will be generated. You will only see this password once, so make sure to copy it.</p>
          
          <div v-if="resetPasswordDialog.newPassword" class="my-4">
            <div class="field-label text-content-secondary dark:text-content-secondary-dark">New Password</div>
            <div class="flex items-center">
              <code class="p-2 rounded text-sm flex-1 font-mono bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-primary dark:text-content-primary-dark">
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
import { useTopicPermission } from '../../../composables/useTopicPermission'

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
  navigateToClientDetail
} = useClient()

// Use the topic permission composable for roles
const {
  permissions: roles,
  loading: rolesLoading,
  fetchPermissions,
  navigateToPermissionCreate: navigateToCreateRole
} = useTopicPermission()

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
    fetchPermissions({
      sort: 'name', // Sort by name for better dropdown display
    })
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

<style scoped>
/* Form input styling */
.form-input {
  transition: all 0.2s ease;
}

.field-label {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
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

:deep(.dark .p-dialog) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.dark .p-dialog .p-dialog-header) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-dialog .p-dialog-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.dark .p-dialog .p-dialog-footer) {
  background-color: var(--surface-card);
  border-color: var(--surface-border);
}
</style>
