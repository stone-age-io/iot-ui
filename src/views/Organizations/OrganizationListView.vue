<template>
  <div>
    <PageHeader title="Organizations" subtitle="Manage your organizations">
      <template #actions>
        <Button 
          v-if="canManageOrganizations"
          label="Create Organization" 
          icon="pi pi-plus" 
          @click="navigateToCreateOrganization" 
        />
      </template>
    </PageHeader>
    
    <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
      <div class="p-6">
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <ProgressSpinner strokeWidth="4" />
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          <div class="flex items-start">
            <i class="pi pi-exclamation-circle mt-0.5 mr-2"></i>
            <div>
              <p class="font-medium">Failed to load organizations</p>
              <p class="mt-1 text-sm">{{ error }}</p>
              <Button 
                label="Try Again" 
                icon="pi pi-refresh" 
                class="p-button-sm mt-2" 
                @click="fetchOrganizations"
              />
            </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="organizations.length === 0" class="text-center py-12">
          <div class="text-4xl text-gray-300 dark:text-gray-600 mb-4">
            <i class="pi pi-building"></i>
          </div>
          <h3 class="text-xl font-medium text-content-primary dark:text-content-primary-dark mb-2">No Organizations Found</h3>
          <p class="text-content-secondary dark:text-content-secondary-dark mb-6">
            {{ canManageOrganizations ? 'You have not created any organizations yet.' : 'You have not been added to any organizations yet.' }}
          </p>
          <Button 
            v-if="canManageOrganizations"
            label="Create Your First Organization" 
            icon="pi pi-plus" 
            @click="navigateToCreateOrganization" 
          />
        </div>
        
        <!-- Organizations list -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="org in organizations" 
            :key="org.id"
            class="bg-surface-secondary dark:bg-surface-secondary-dark border border-border-light dark:border-border-light-dark rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
            @click="navigateToOrganizationDetail(org.id)"
          >
            <!-- Organization Card -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center">
                <div v-if="org.logo" class="w-10 h-10 mr-3">
                  <img :src="org.logo" alt="Logo" class="w-full h-full object-contain rounded" />
                </div>
                <div v-else class="w-10 h-10 bg-primary-700 rounded-md flex items-center justify-center text-white mr-3">
                  {{ org.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="font-medium text-content-primary dark:text-content-primary-dark">{{ org.name }}</div>
                  <div class="text-sm text-content-secondary dark:text-content-secondary-dark">{{ org.code }}</div>
                </div>
              </div>
              
              <!-- Current indicator -->
              <div v-if="org.id === currentOrganization?.id" class="px-2 py-1 text-xs rounded-full font-medium text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/30">
                Current
              </div>
            </div>
            
            <!-- Description -->
            <p v-if="org.description" class="text-sm text-content-secondary dark:text-content-secondary-dark mb-3 line-clamp-2">
              {{ org.description }}
            </p>
            
            <!-- Actions -->
            <div class="flex justify-end mt-4">
              <Button 
                v-if="org.id !== currentOrganization?.id"
                label="Switch to" 
                icon="pi pi-arrow-right" 
                class="p-button-sm p-button-text" 
                @click.stop="switchToOrganization(org)"
              />
              <Button 
                v-if="canManageOrganizations"
                icon="pi pi-pencil" 
                class="p-button-sm p-button-text ml-2" 
                @click.stop="navigateToEditOrganization(org.id)"
                tooltip="Edit"
              />
              <Button 
                v-if="canManageOrganizations && organizations.length > 1 && org.id !== currentOrganization?.id"
                icon="pi pi-trash" 
                class="p-button-sm p-button-text p-button-danger ml-2" 
                @click.stop="handleDeleteClick(org)"
                tooltip="Delete"
              />
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
import { computed, onMounted } from 'vue'
import { useOrganization } from '../../composables/useOrganization'
import { useDeleteConfirmation } from '../../composables/useConfirmation'
import PageHeader from '../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

// Get organization functionality from composable
const { 
  organizations,
  userOrganizations,
  currentOrganization,
  canManageOrganizations,
  loading,
  error,
  fetchOrganizations,
  fetchUserOrganizations,
  switchOrganization,
  deleteOrganization,
  navigateToOrganizationDetail,
  navigateToCreateOrganization,
  navigateToEditOrganization
} = useOrganization()

// Get delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// On component mount
onMounted(async () => {
  // Load either all organizations (for admins) or just user's organizations
  if (canManageOrganizations.value) {
    await fetchOrganizations()
  } else {
    await fetchUserOrganizations()
  }
})

// Switch to an organization
const switchToOrganization = async (org) => {
  if (org.id !== currentOrganization.value?.id) {
    await switchOrganization(org.id)
  }
}

// Handle delete button click
const handleDeleteClick = (org) => {
  confirmDelete(org, 'Organization')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!deleteDialog.value.item) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteOrganization(
    deleteDialog.value.item.id, 
    deleteDialog.value.item.name
  )
  
  if (success) {
    resetDeleteDialog()
    
    // Refresh the list
    if (canManageOrganizations.value) {
      await fetchOrganizations()
    } else {
      await fetchUserOrganizations()
    }
  } else {
    updateDeleteDialog({ loading: false })
  }
}
</script>

<style scoped>
/* Line clamp for descriptions */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
