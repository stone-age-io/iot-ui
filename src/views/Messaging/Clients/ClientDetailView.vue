<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner strokeWidth="4" />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="card p-6 text-center">
      <div class="text-red-500 text-xl mb-4">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load client details
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Client Details -->
    <div v-else-if="client">
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">Messaging Client</div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ client.username }}</h1>
          <div class="text-gray-600" v-if="client.expand && client.expand.role_id">
            <span>{{ client.expand.role_id.name }}</span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToEdit"
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
        <div class="card lg:col-span-2">
          <h2 class="text-xl font-semibold mb-4">Client Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Username -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Username</div>
              <div class="font-mono text-lg">{{ client.username }}</div>
            </div>
            
            <!-- Role -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Role</div>
              <div class="flex items-center">
                <router-link 
                  v-if="client.expand && client.expand.role_id"
                  :to="{ name: 'topic-permission-detail', params: { id: client.role_id } }"
                  class="text-primary-600 hover:underline flex items-center"
                >
                  {{ client.expand.role_id.name }}
                </router-link>
                <span v-else class="text-gray-500">No role assigned</span>
              </div>
            </div>
            
            <!-- Status -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Status</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="client.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ client.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Information Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Information</h2>
          
          <div class="space-y-6">
            <!-- Role Details -->
            <div v-if="client.expand && client.expand.role_id">
              <div class="text-sm text-gray-500 mb-1">Role Details</div>
              <div class="text-gray-700">
                <p>Role: {{ client.expand.role_id.name }}</p>
                <Button
                  label="View Role Details"
                  icon="pi pi-arrow-right"
                  class="p-button-text p-button-sm mt-2"
                  @click="navigateToRole"
                />
              </div>
            </div>
            
            <!-- Created Date -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Created</div>
              <div class="text-gray-700">{{ formatDate(client.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Last Updated</div>
              <div class="text-gray-700">{{ formatDate(client.updated) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Credentials Section -->
      <div class="card mt-6">
        <h2 class="text-xl font-semibold mb-4">Connection Credentials</h2>
        
        <div class="bg-gray-50 p-4 rounded border border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500 mb-1">Connection URL</div>
              <div class="flex items-center">
                <code class="bg-gray-100 p-2 rounded text-sm flex-1 font-mono">
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
              <div class="text-sm text-gray-500 mb-1">Username</div>
              <div class="flex items-center">
                <code class="bg-gray-100 p-2 rounded text-sm flex-1 font-mono">
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
            <div class="text-sm text-gray-500 mb-1">Password</div>
            <div class="bg-gray-100 p-2 rounded text-sm flex items-center">
              <div class="flex-1 text-gray-500 italic">Password hidden for security</div>
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
      @confirm="deleteClient"
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
        <p class="mb-4">Are you sure you want to reset the password for <strong>{{ client?.username }}</strong>?</p>
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
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { clientService, generateSecurePassword } from '../../../services/client'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Data
const client = ref(null)
const loading = ref(true)
const error = ref(null)
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
const connectionUrl = computed(() => {
  return import.meta.env.VITE_MQTT_HOST || 'mqtt://localhost:1883'
})

// Fetch client data on component mount
onMounted(async () => {
  await fetchClient()
})

// Methods
const fetchClient = async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Invalid client ID'
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const response = await clientService.getClient(id)
    client.value = response.data
  } catch (err) {
    console.error('Error fetching client:', err)
    error.value = 'Failed to load client details. Please try again.'
  } finally {
    loading.value = false
  }
}

const navigateToEdit = () => {
  router.push({ name: 'edit-client', params: { id: client.value.id } })
}

const navigateToRole = () => {
  router.push({ 
    name: 'topic-permission-detail', 
    params: { id: client.value.role_id } 
  })
}

const confirmDelete = () => {
  deleteDialog.value.visible = true
}

const deleteClient = async () => {
  deleteDialog.value.loading = true
  try {
    await clientService.deleteClient(client.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Client ${client.value.username} has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
    router.push({ name: 'clients' })
  } catch (error) {
    console.error('Error deleting client:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete client',
      life: 3000
    })
  } finally {
    deleteDialog.value.loading = false
  }
}

const showResetPasswordDialog = () => {
  resetPasswordDialog.value.visible = true
  resetPasswordDialog.value.newPassword = null
}

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

// Helper methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return dayjs(dateString).format('MMM D, YYYY HH:mm')
}
</script>
