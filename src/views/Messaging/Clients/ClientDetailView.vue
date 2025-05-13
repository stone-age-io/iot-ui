<!-- src/views/Messaging/Clients/ClientDetailView.vue -->
<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner 
        strokeWidth="4" 
        class="text-primary-500 dark:text-primary-400" 
      />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="p-6 text-center bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark rounded-lg shadow-theme-md">
      <div class="text-xl mb-4 text-red-600 dark:text-red-400">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load client details
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Client Details -->
    <div v-else-if="client">
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Messaging Client</div>
          <h1 class="text-2xl font-bold mb-1 text-content-primary dark:text-content-primary-dark">{{ client.username }}</h1>
          <div class="text-content-secondary dark:text-content-secondary-dark" v-if="client.expand && client.expand.role_id">
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
          <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
            <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Client Details</h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <!-- Username -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Username</div>
                  <div class="font-mono text-lg text-content-primary dark:text-content-primary-dark">{{ client.username }}</div>
                </div>
                
                <!-- Role -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Role</div>
                  <div class="flex items-center">
                    <router-link 
                      v-if="client.expand && client.expand.role_id"
                      :to="{ name: 'topic-permission-detail', params: { id: client.role_id } }"
                      class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
                    >
                      {{ client.expand.role_id.name }}
                    </router-link>
                    <span v-else class="text-content-secondary dark:text-content-secondary-dark">No role assigned</span>
                  </div>
                </div>
                
                <!-- Status -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Status</div>
                  <div class="flex items-center">
                    <span 
                      class="badge"
                      :class="client.active ? 
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
                    >
                      {{ client.active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
                
                <!-- Created Date -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Created</div>
                  <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(client.created) }}</div>
                </div>
                
                <!-- Last Updated -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Last Updated</div>
                  <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(client.updated) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Information Card -->
        <div>
          <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
            <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Information</h2>
            </div>
            <div class="p-6">
              <div class="space-y-6">
                <!-- Role Details -->
                <div v-if="client.expand && client.expand.role_id">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Role Details</div>
                  <div class="text-content-primary dark:text-content-primary-dark">
                    <p>Role: {{ client.expand.role_id.name }}</p>
                    <Button
                      label="View Role Details"
                      icon="pi pi-arrow-right"
                      class="p-button-text p-button-sm mt-2"
                      @click="navigateToRoleDetail(client.role_id)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Credentials Section -->
      <div class="mt-6">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Connection Credentials</h2>
          </div>
          <div class="p-6">
            <div class="p-4 rounded border bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark theme-transition">
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">MQTT Connection URL</div>
                  <div class="flex items-center">
                    <code class="p-2 rounded text-sm flex-1 font-mono bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-primary dark:text-content-primary-dark">
                      {{ mqttConnectionUrl }}
                    </code>
                    <Button 
                      icon="pi pi-copy" 
                      class="p-button-text ml-2" 
                      @click="copyToClipboard(mqttConnectionUrl)"
                      tooltip="Copy"
                    />
                  </div>
                </div>
                
                <div>
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">NATS Connection URL</div>
                  <div class="flex items-center">
                    <code class="p-2 rounded text-sm flex-1 font-mono bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-primary dark:text-content-primary-dark">
                      {{ natsConnectionUrl }}
                    </code>
                    <Button 
                      icon="pi pi-copy" 
                      class="p-button-text ml-2" 
                      @click="copyToClipboard(natsConnectionUrl)"
                      tooltip="Copy"
                    />
                  </div>
                </div>
                
                <div>
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">WebSocket Connection URL</div>
                  <div class="flex items-center">
                    <code class="p-2 rounded text-sm flex-1 font-mono bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-primary dark:text-content-primary-dark">
                      {{ wsConnectionUrl }}
                    </code>
                    <Button 
                      icon="pi pi-copy" 
                      class="p-button-text ml-2" 
                      @click="copyToClipboard(wsConnectionUrl)"
                      tooltip="Copy"
                    />
                  </div>
                </div>
                
                <div>
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Username</div>
                  <div class="flex items-center">
                    <code class="p-2 rounded text-sm flex-1 font-mono bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-primary dark:text-content-primary-dark">
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
                <div class="field-label text-content-secondary dark:text-content-secondary-dark">Password</div>
                <div class="p-2 rounded text-sm flex items-center bg-surface-tertiary dark:bg-surface-tertiary-dark">
                  <div class="flex-1 italic text-content-secondary dark:text-content-secondary-dark">Password hidden for security</div>
                  <Button
                    label="Reset Password"
                    icon="pi pi-refresh"
                    class="p-button-outlined p-button-sm"
                    @click="showResetPasswordDialog"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
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
        <p class="mb-4 text-content-primary dark:text-content-primary-dark">Are you sure you want to reset the password for <strong>{{ client?.username }}</strong>?</p>
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClient } from '../../../composables/useClient'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()

// Use the client composable
const { 
  loading,
  error,
  formatDate,
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
const mqttConnectionUrl = computed(() => {
  // Use environment variable or fallback value
  const mqttHost = import.meta.env.VITE_MQTT_HOST || 'mqtt.example.com';
  const mqttPort = import.meta.env.VITE_MQTT_PORT || '8883';
  return `${mqttHost}:${mqttPort}`;
});

const natsConnectionUrl = computed(() => {
  // Use environment variable or fallback value
  const natsHost = import.meta.env.VITE_NATS_HOST || 'nats.example.com';
  const natsPort = import.meta.env.VITE_NATS_PORT || '4222';
  return `${natsHost}:${natsPort}`;
});

const wsConnectionUrl = computed(() => {
  // Use environment variable or fallback value
  const wsHost = import.meta.env.VITE_WS_HOST || 'ws.example.com';
  const wsPort = import.meta.env.VITE_WS_PORT || '9001';
  return `${wsHost}:${wsPort}`;
});

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

/* Fix PrimeVue Dialog styling in dark mode */
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
