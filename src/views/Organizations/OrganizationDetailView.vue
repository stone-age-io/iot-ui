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
    <div v-else-if="error" class="p-error-container p-6 text-center bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark rounded-lg shadow-theme-md">
      <div class="text-xl mb-4 text-red-600 dark:text-red-400">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load organization details
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Organization Details -->
    <div v-else-if="organization" class="organization-detail-container">
      <!-- Header Section with organization title and actions -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Organization</div>
          <h1 class="text-2xl font-bold mb-1 text-content-primary dark:text-content-primary-dark">{{ organization.name }}</h1>
          <div class="font-mono text-content-secondary dark:text-content-secondary-dark">
            {{ organization.code }}
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            v-if="organization.id !== currentOrganization?.id"
            icon="pi pi-arrow-right"
            label="Switch to"
            class="p-button-outlined p-button-success"
            @click="switchToOrganization"
          />
          <Button
            v-if="canManageOrganizations"
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToEditOrganization(organization.id)"
          />
          <Button
            v-if="canManageOrganizations && organization.id !== currentOrganization?.id"
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="handleDeleteClick"
          />
        </div>
      </div>
      
      <!-- Main Details Card -->
      <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
        <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Organization Details</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Code -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Code</div>
              <div class="font-mono text-lg text-content-primary dark:text-content-primary-dark">{{ organization.code }}</div>
            </div>
            
            <!-- Name -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Name</div>
              <div class="text-lg text-content-primary dark:text-content-primary-dark">{{ organization.name }}</div>
            </div>
            
            <!-- Status -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Status</div>
              <div class="flex items-center">
                <span class="badge" :class="organization.id === currentOrganization?.id ? 
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'">
                  {{ organization.id === currentOrganization?.id ? 'Current' : 'Not Active' }}
                </span>
              </div>
            </div>
            
            <!-- User Role -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Your Role</div>
              <div class="flex items-center">
                <span class="badge" :class="userRole === 'admin' ? 
                  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'">
                  {{ userRole === 'admin' ? 'Administrator' : 'Member' }}
                </span>
              </div>
            </div>
            
            <!-- Created Date -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Created</div>
              <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(organization.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Last Updated</div>
              <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(organization.updated) }}</div>
            </div>
            
            <!-- Description -->
            <div v-if="organization.description" class="md:col-span-2">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Description</div>
              <div class="text-content-primary dark:text-content-primary-dark">{{ organization.description }}</div>
            </div>
            
            <!-- Settings (if any) -->
            <div v-if="hasOrganizationSettings" class="md:col-span-2">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Settings</div>
              <div class="p-3 rounded border font-mono text-sm overflow-x-auto bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark text-content-primary dark:text-content-primary-dark">
                <pre>{{ JSON.stringify(organization.settings, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Members Section -->
      <div class="mt-6">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
              Organization Members
            </h2>
          </div>
          <div class="p-6">
            <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">
              Members have access to this organization's data. Administrators can manage the organization and its members.
            </p>
            
            <div class="mt-4">
              <!-- Placeholder for member management UI - To be implemented -->
              <div class="bg-surface-secondary dark:bg-surface-secondary-dark p-4 rounded-lg border border-border-light dark:border-border-light-dark text-center">
                <p class="text-content-secondary dark:text-content-secondary-dark">
                  Member management will be available in a future update.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:visible="deleteDialog.visible"
      :title="deleteDialog.title"
      :type="deleteDialog.type"
      :confirm-label="deleteDialog.confirmLabel"
      :confirm-icon="deleteDialog.confirmIcon"
      :loading="deleteDialog.loading"
      :message="deleteDialog.message"
      :details="deleteDialog.details"
      @confirm="handleDeleteConfirm"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganization } from '../../composables/useOrganization'
import { useDeleteConfirmation } from '../../composables/useConfirmation'
import dayjs from 'dayjs'
import ConfirmationDialog from '../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()

// Organization functionality from composable
const { 
  loading, 
  error, 
  currentOrganization,
  userRole,
  isAdmin,
  canManageOrganizations,
  switchOrganization,
  deleteOrganization,
  navigateToEditOrganization,
  navigateToOrganizations
} = useOrganization()

// Delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Local state
const organization = ref(null)

// Check if organization has settings
const hasOrganizationSettings = computed(() => {
  return organization.value && 
         organization.value.settings && 
         typeof organization.value.settings === 'object' && 
         Object.keys(organization.value.settings).length > 0
})

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return dayjs(dateString).format('MMM D, YYYY HH:mm')
}

// Fetch organization data on component mount
onMounted(async () => {
  const organizationId = router.currentRoute.value.params.id
  if (organizationId) {
    await loadOrganizationDetail(organizationId)
  }
})

// Methods
const loadOrganizationDetail = async (id) => {
  if (!id) return
  
  try {
    // Fetch organization data
    const response = await organizationService.getById(id)
    if (response && response.data) {
      organization.value = response.data
    }
  } catch (err) {
    console.error('Failed to load organization detail:', err)
    error.value = err.message || 'Failed to load organization details'
  }
}

// Switch to this organization
const switchToOrganization = async () => {
  if (!organization.value) return
  
  if (organization.value.id !== currentOrganization.value?.id) {
    await switchOrganization(organization.value.id)
  }
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!organization.value) return
  confirmDelete(organization.value, 'Organization')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!organization.value) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteOrganization(organization.value.id, organization.value.name)
  
  if (success) {
    resetDeleteDialog()
    navigateToOrganizations()
  } else {
    updateDeleteDialog({ loading: false })
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
</style>
