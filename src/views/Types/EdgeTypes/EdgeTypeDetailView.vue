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
    <div v-else-if="error" :class="['p-6 text-center', backgroundColor.surface, borderColor.default, shadowStyle.md]">
      <div :class="['text-xl mb-4', textColor.error]">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load edge type details
      </div>
      <p :class="['mb-4', textColor.secondary]">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Edge Type Details -->
    <div v-else-if="typeData" class="edge-type-detail-container">
      <!-- Header Section with Type title and actions -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div :class="['text-sm mb-1', textColor.secondary]">Edge Type</div>
          <h1 :class="['text-2xl font-bold mb-1', textColor.primary]">{{ typeData.type }}</h1>
          <div :class="['font-mono', textColor.secondary]">
            <span :class="[
              'px-2 py-1 rounded', 
              backgroundColor.secondary,
              borderColor.light
            ]">
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
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="lg:col-span-2">
          <Card class="h-full">
            <template #title>
              <h2 :class="['text-xl font-semibold', textColor.primary]">Type Details</h2>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <!-- Name -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Name</div>
                  <div :class="['text-lg', textColor.primary]">{{ typeData.type }}</div>
                </div>
                
                <!-- Code -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Code</div>
                  <div :class="['font-mono text-lg', textColor.primary]">{{ typeData.code }}</div>
                </div>
                
                <!-- Description -->
                <div class="md:col-span-2">
                  <div :class="['field-label', textColor.secondary]">Description</div>
                  <div :class="[
                    'p-3 rounded border', 
                    backgroundColor.secondary,
                    borderColor.default,
                    textColor.primary
                  ]">
                    {{ typeData.description || 'No description provided' }}
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
        
        <!-- Stats/Info Card -->
        <div>
          <Card class="h-full">
            <template #title>
              <h2 :class="['text-xl font-semibold', textColor.primary]">Information</h2>
            </template>
            <template #content>
              <div class="space-y-6">
                <!-- Created Date -->
                <div class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Created</div>
                  <div :class="textColor.secondary">{{ formatDate(typeData.created) }}</div>
                </div>
                
                <!-- Last Updated -->
                <div class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Last Updated</div>
                  <div :class="textColor.secondary">{{ formatDate(typeData.updated) }}</div>
                </div>
                
                <!-- Edge Usage -->
                <div class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Used by Edges</div>
                  <div class="flex items-center">
                    <i :class="['pi pi-server mr-2', themeValue.class('text-blue-600', 'text-blue-400')]"></i>
                    <div :class="['text-2xl font-semibold', textColor.primary]">{{ usageStats?.count || 0 }}</div>
                  </div>
                  <Button
                    label="View Edges"
                    icon="pi pi-arrow-right"
                    class="p-button-text p-button-sm mt-2"
                    @click="navigateToEdges(typeData.code)"
                    :disabled="!usageStats?.count"
                  />
                </div>
              </div>
            </template>
          </Card>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEdgeType } from '../../../composables/useEdgeType'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTheme } from '../../../composables/useTheme'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor, shadowStyle } = useTheme()

// Edge type functionality from composable
const { 
  loading, 
  error, 
  formatDate,
  fetchType,
  deleteType,
  navigateToTypeList,
  navigateToTypeEdit
} = useEdgeType()

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

// Fetch edge type data on component mount
onMounted(async () => {
  await loadTypeDetail()
})

// Methods
const loadTypeDetail = async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch edge type data
    const data = await fetchType(id)
    if (data) {
      typeData.value = data
      
      // Fetch usage stats (edges using this type)
      await fetchUsageStats()
    }
  } catch (err) {
    // Error handling is done in the composable
  }
}

// Fetch stats about how many edges use this type
const fetchUsageStats = async () => {
  if (!typeData.value || !typeData.value.code) return
  
  try {
    const { edgeService } = await import('../../../services')
    const response = await edgeService.getEdges({
      type: typeData.value.code,
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

// Navigate to edges filtered by this type
const navigateToEdges = (typeCode) => {
  router.push({ 
    name: 'edges',
    query: { type: typeCode }
  })
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!typeData.value) return
  
  // Show warning if there are edges using this type
  if (usageStats.value && usageStats.value.count > 0) {
    confirmDelete(
      typeData.value,
      'edge type',
      'type',
      {
        message: `Are you sure you want to delete edge type "${typeData.value.type}"?`,
        details: `This type is currently used by ${usageStats.value.count} edge${usageStats.value.count > 1 ? 's' : ''}. Deleting it may cause issues with those edges.`
      }
    )
  } else {
    confirmDelete(typeData.value, 'edge type', 'type')
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

.detail-field, .stat-item {
  display: flex;
  flex-direction: column;
}

/* Fix PrimeVue components styling in dark mode */
:deep(.dark .p-card),
:deep(.dark .p-card .p-card-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.p-card .p-card-title) {
  color: var(--text-color);
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
