<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner 
        strokeWidth="4" 
        :class="themeValue.class('text-primary-500', 'text-primary-400')" 
      />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="p-error-container p-6 text-center">
      <div :class="['text-xl mb-4', textColor.error]">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load client details
      </div>
      <p :class="['mb-4', textColor.secondary]">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Client Details -->
    <div v-else-if="client">
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div :class="['text-sm mb-1', textColor.secondary]">Messaging Client</div>
          <h1 :class="['text-2xl font-bold mb-1', textColor.primary]">{{ client.username }}</h1>
          <div :class="[textColor.secondary]" v-if="client.expand && client.expand.role_id">
            <span>{{ client.expand.role_id.name }}</span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToClientEdit(client.id)"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="confirmDelete"
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="lg:col-span-2">
          <Card>
            <template #title>
              <h2 :class="['text-xl font-semibold', textColor.primary]">Client Details</h2>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <!-- Username -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Username</div>
                  <div :class="['font-mono text-lg', textColor.primary]">{{ client.username }}</div>
                </div>
                
                <!-- Role -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Role</div>
                  <div class="flex items-center">
                    <router-link 
                      v-if="client.expand && client.expand.role_id"
                      :to="{ name: 'topic-permission-detail', params: { id: client.role_id } }"
                      :class="themeValue.class('text-primary-600 hover:text-primary-700', 'text-primary-400 hover:text-primary-300') + ' flex items-center'"
                    >
                      {{ client.expand.role_id.name }}
                    </router-link>
                    <span v-else :class="textColor.secondary">No role assigned</span>
                  </div>
                </div>
                
                <!-- Status -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Status</div>
                  <div class="flex items-center">
                    <span 
                      class="badge"
                      :class="client.active ? 
                        themeValue.class('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300') : 
                        themeValue.class('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300')"
                    >
                      {{ client.active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
        
        <!-- Information Card -->
        <div>
          <Card>
            <template #title>
              <h2 :class="['text-xl font-semibold', textColor.primary]">Information</h2>
            </template>
            <template #content>
              <div class="space-y-6">
                <!-- Role Details -->
                <div v-if="client.expand && client.expand.role_id">
                  <div :class="['field-label', textColor.secondary]">Role Details</div>
                  <div :class="textColor.primary">
                    <p>Role: {{ client.expand.role_id.name }}</p>
                    <Button
                      label="View Role Details"
                      icon="pi pi-arrow-right"
                      class="p-button-text p-button-sm mt-2"
                      @click="navigateToRoleDetail(client.role_id)"
                    />
                  </div>
                </div>
                
                <!-- Created Date -->
                <div>
                  <div :class="['field-label', textColor.secondary]">Created</div>
                  <div :class="textColor.secondary">{{ formatDate(client.created) }}</div>
                </div>
                
                <!-- Last Updated -->
                <div>
                  <div :class="['field-label', textColor.secondary]">Last Updated</div>
                  <div :class="textColor.secondary">{{ formatDate(client.updated) }}</div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Credentials Section -->
      <div class="mt-6">
        <Card>
          <template #title>
            <h2 :class="['text-xl font-semibold', textColor.primary]">Connection Credentials</h2>
          </template>
          <template #content>
            <div :class="[
              'p-4 rounded border',
              backgroundColor.secondary,
              borderColor.default
            ]">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div :class="['field-label', textColor.secondary]">Connection URL</div>
                  <div class="flex items-center">
                    <code :class="[
                      'p-2 rounded text-sm flex-1 font-mono',
                      backgroundColor.tertiary,
                      textColor.primary
                    ]">
                      {{ connectionUrl }}
                    </code>
                    <Button 
                      icon="pi pi-copy" 
                      class="p-button-text ml-2" 
                      @click="copyToClipboard(connectionUrl)"
                      tooltip="Copy"
                    />
                  </div>
                </div>
                
                <div>
                  <div :class="['field-label', textColor.secondary]">Username</div>
                  <div class="flex items-center">
                    <code :class="[
                      'p-2 rounded text-sm flex-1 font-mono',
                      backgroundColor.tertiary,
                      textColor.primary
                    ]">
                      {{ client.username }}
                    </code>
                    <Button 
                      icon="pi pi-copy" 
                      class="p-button-text ml-2" 
                      @click="copyToClipboard(client.username)"
                      tooltip="Copy"
                    />
                  </div>
                </div>
              </div>
              
              <div class="mt-4">
                <div :class="['field-label', textColor.secondary]">Password</div>
                <div :class="[
                  'p-2 rounded text-sm flex items-center',
                  backgroundColor.tertiary
                ]">
                  <div :class="['flex-1 italic', textColor.secondary]">Password hidden for security</div>
                  <Button
                    label="Reset Password"
                    icon="pi pi-refresh"
                    class="p-button-outlined p-button-sm"
                    @click="showResetPasswordDialog"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:visible="deleteDialog.visible"
      title="Delete Client"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete client '${client?.username || ''}'?`"
      details="This action cannot be undone."
      @confirm="handleDeleteClient"
    />
    
    <!-- Reset Password Dialog -->
    <Dialog 
      v-model:visible="resetPasswordDialog.visible" 
      header="Reset Password" 
      :style="{ width: '450px' }"
      :modal="true"
      :closable="!resetPasswordDialog.loading"
    >
      <div class="p-4">
        <p :class="['mb-4', textColor.primary]">Are you sure you want to reset the password for <strong>{{ client?.username }}</strong>?</p>
        <p :class="['text-sm mb-4', textColor.secondary]">A new secure password will be generated. You will only see this password once, so make sure to copy it.</p>
        
        <div v-if="resetPasswordDialog.newPassword" class="my-4">
          <div :class="['field-label', textColor.secondary]">New Password</div>
          <div class="flex items-center">
            <code :class="[
              'p-2 rounded text-sm flex-1 font-mono',
              backgroundColor.tertiary,
              textColor.primary
            ]">
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
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClient } from '../../../composables/useClient'
import { useTheme } from '../../../composables/useTheme'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Card from 'primevue/card'

const route = useRoute()
const router = useRouter()

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor } = useTheme()

// Use the client composable
const { 
  loading,
  error,
  formatDate,
  getConnectionUrl,
  fetchClient,
  deleteClient,
  resetPassword,
  copyToClipboard,
  navigateToClientEdit,
  navigateToRoleDetail,
  navigateToClientList
} = useClient()

// Data
const client = ref(null)
const deleteDialog = ref({
  visible: false,
  loading: false
})

// Reset password dialog
const resetPasswordDialog = ref({
  visible: false,
  loading: false,
  newPassword: null
})

// Computed properties
const connectionUrl = computed(() => getConnectionUrl())

// Fetch client data on component mount
onMounted(async () => {
  const id = route.params.id
  client.value = await fetchClient(id)
})

// Methods
const confirmDelete = () => {
  deleteDialog.value.visible = true
}

const handleDeleteClient = async () => {
  deleteDialog.value.loading = true
  try {
    const success = await deleteClient(client.value.id, client.value.username)
    if (success) {
      deleteDialog.value.visible = false
      navigateToClientList()
    }
  } finally {
    deleteDialog.value.loading = false
  }
}

const showResetPasswordDialog = () => {
  resetPasswordDialog.value.visible = true
  resetPasswordDialog.value.newPassword = null
}

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
/* Theme-aware styling */
:deep(.p-card) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

:deep(.p-card .p-card-title) {
  padding: 1.25rem 1.5rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--surface-border);
  font-size: 1.25rem;
  font-weight: 600;
}

:deep(.p-card .p-card-content) {
  padding: 1.5rem;
}

:deep(.p-card .p-card-footer) {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-border);
}

.field-label {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.detail-field {
  display: flex;
  flex-direction: column;
}

/* Error container styling */
.p-error-container {
  background-color: var(--surface-card);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--surface-border);
}

/* Fix PrimeVue Card styling in dark mode */
:deep(.dark .p-card),
:deep(.dark .p-card .p-card-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.p-card .p-card-title) {
  color: var(--text-color);
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
