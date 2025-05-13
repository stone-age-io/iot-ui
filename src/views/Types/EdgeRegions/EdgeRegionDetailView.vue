```vue
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
        Failed to load edge region details
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Edge Region Details -->
    <div v-else-if="typeData" class="edge-region-detail-container">
      <!-- Header Section with Region title and actions -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Edge Region</div>
          <h1 class="text-2xl font-bold mb-1 text-content-primary dark:text-content-primary-dark">{{ typeData.type }}</h1>
          <div class="font-mono text-content-secondary dark:text-content-secondary-dark">
            <span class="px-2 py-1 rounded bg-surface-secondary dark:bg-surface-secondary-dark border border-border-secondary dark:border-border-secondary-dark">
              {{ typeData.code }}
            </span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToTypeEdit(typeData.id)"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="handleDeleteClick"
          />
        </div>
      </div>
      
      <!-- Main Details Card - Now full width -->
      <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
        <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Region Details</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Name -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Name</div>
              <div class="text-lg text-content-primary dark:text-content-primary-dark">{{ typeData.type }}</div>
            </div>
            
            <!-- Code -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Code</div>
              <div class="font-mono text-lg text-content-primary dark:text-content-primary-dark">{{ typeData.code }}</div>
            </div>
            
            <!-- Created Date -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Created</div>
              <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(typeData.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Last Updated</div>
              <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(typeData.updated) }}</div>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Description</div>
              <div class="p-3 rounded border bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark text-content-primary dark:text-content-primary-dark">
                {{ typeData.description || 'No description provided' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Usage Stats Card -->
      <div class="mt-6" v-if="usageStats">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
              Usage Statistics
            </h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Edge Count -->
              <div class="bg-surface-secondary dark:bg-surface-secondary-dark rounded-lg p-4 border border-border-light dark:border-border-light-dark">
                <div class="text-sm text-content-secondary dark:text-content-secondary-dark mb-1">Edges Using This Region</div>
                <div class="flex items-center">
                  <i class="pi pi-server mr-2 text-blue-600 dark:text-blue-400"></i>
                  <div class="text-2xl font-semibold text-content-primary dark:text-content-primary-dark">{{ usageStats.count || 0 }}</div>
                </div>
                <Button
                  label="View Edges"
                  icon="pi pi-arrow-right"
                  class="p-button-text p-button-sm mt-3"
                  @click="navigateToEdges(typeData.code)"
                  :disabled="!usageStats.count"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Code Example Card -->
      <div class="mt-6">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Code Example</h2>
          </div>
          <div class="p-6">
            <p class="mb-3 text-content-secondary dark:text-content-secondary-dark">
              This is an example of how this edge region's code is used to generate edge codes:
            </p>
            
            <div class="p-4 rounded-md font-mono border bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark">
              <div class="text-content-secondary dark:text-content-secondary-dark">// Example edge code structure</div>
              <div class="mt-2">
                <span class="text-content-secondary dark:text-content-secondary-dark">type-</span>
                <span class="text-blue-600 dark:text-blue-400">{{ typeData.code }}</span>
                <span class="text-content-secondary dark:text-content-secondary-dark">-number</span>
              </div>
              <div class="mt-2 text-content-secondary dark:text-content-secondary-dark">// e.g., bld-{{ typeData.code }}-001</div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEdgeRegion } from '../../../composables/useEdgeRegion'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()

// Edge region functionality from composable
const { 
  loading, 
  error, 
  formatDate,
  fetchType,
  deleteType,
  navigateToTypeList,
  navigateToTypeEdit
} = useEdgeRegion()

// Delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Local state
const typeData = ref(null)
const usageStats = ref(null)

// Fetch edge region data on component mount
onMounted(async () => {
  await loadTypeDetail()
})

// Methods
const loadTypeDetail = async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch edge region data
    const data = await fetchType(id)
    if (data) {
      typeData.value = data
      
      // Fetch usage stats (edges using this region)
      await fetchUsageStats()
    }
  } catch (err) {
    // Error handling is done in the composable
  }
}

// Fetch stats about how many edges use this region
const fetchUsageStats = async () => {
  if (!typeData.value || !typeData.value.code) return
  
  try {
    const { edgeService } = await import('../../../services')
    const response = await edgeService.getList({
      region: typeData.value.code,
      fields: 'id', // Only fetch IDs to make the request lighter
      '$countOnly': true // Request only count if endpoint supports it
    })
    
    usageStats.value = {
      count: response.data.totalItems || 0
    }
  } catch (err) {
    console.error('Error fetching usage stats:', err)
    usageStats.value = { count: 0 }
  }
}

// Navigate to edges filtered by this region
const navigateToEdges = (regionCode) => {
  router.push({ 
    name: 'edges',
    query: { region: regionCode }
  })
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!typeData.value) return
  
  // Show warning if there are edges using this region
  if (usageStats.value && usageStats.value.count > 0) {
    confirmDelete(
      typeData.value,
      'edge region',
      'type',
      {
        message: `Are you sure you want to delete edge region "${typeData.value.type}"?`,
        details: `This region is currently used by ${usageStats.value.count} edge${usageStats.value.count > 1 ? 's' : ''}. Deleting it may cause issues with those edges.`
      }
    )
  } else {
    confirmDelete(typeData.value, 'edge region', 'type')
  }
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!typeData.value) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteType(typeData.value.id, typeData.value.type)
  
  if (success) {
    resetDeleteDialog()
    navigateToTypeList()
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

.detail-field {
  display: flex;
  flex-direction: column;
}

/* Fix button styling */
:deep(.p-button-text) {
  color: var(--primary-color);
}

:deep(.p-button-text:hover) {
  background: rgba(var(--primary-color-rgb), 0.04);
  color: var(--primary-color);
}

:deep(.dark .p-button-text) {
  color: var(--primary-400);
}

:deep(.dark .p-button-text:hover) {
  background: rgba(var(--primary-400-rgb), 0.16);
  color: var(--primary-300);
}
</style>
```
