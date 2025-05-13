<template>
  <div>
    <PageHeader title="Edge Regions" subtitle="Manage your edge region definitions">
      <template #actions>
        <Button 
          label="Create Edge Region" 
          icon="pi pi-plus" 
          @click="navigateToTypeCreate" 
        />
      </template>
    </PageHeader>
    
    <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
      <div class="p-6">
        <DataTable
          :items="types"
          :columns="columns"
          :loading="loading"
          :searchable="true"
          :searchFields="['type', 'code', 'description']"
          empty-message="No edge regions found"
          @row-click="(data) => navigateToTypeDetail(data.id)"
          :paginated="true"
          :rows="10"
        >
          
          <!-- Type column -->
          <template #type-body="{ data }">
            <div class="font-medium text-primary-700 dark:text-primary-400">{{ data.type }}</div>
          </template>
          
          <!-- Code column -->
          <template #code-body="{ data }">
            <span class="text-sm font-mono px-2 py-1 rounded bg-surface-secondary dark:bg-surface-secondary-dark text-content-primary dark:text-content-primary-dark">
              {{ data.code }}
            </span>
          </template>
          
          <!-- Description column with truncation -->
          <template #description-body="{ data }">
            <div 
              class="truncate max-w-md text-content-secondary dark:text-content-secondary-dark" 
              :title="data.description"
            >
              {{ data.description || 'No description' }}
            </div>
          </template>
          
          <!-- Created date column -->
          <template #created-body="{ data }">
            <div class="text-sm text-content-secondary dark:text-content-secondary-dark">
              {{ formatDate(data.created) }}
            </div>
          </template>
          
          <!-- Row actions -->
          <template #row-actions="{ data }">
            <div class="flex gap-1 justify-center">
              <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToTypeDetail(data.id)"
                tooltip="View"
                tooltipOptions="{ position: 'top' }"
              />
              <Button 
                icon="pi pi-pencil" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToTypeEdit(data.id)"
                tooltip="Edit"
                tooltipOptions="{ position: 'top' }"
              />
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-text p-button-sm p-button-danger" 
                @click.stop="handleDeleteClick(data)"
                tooltip="Delete"
                tooltipOptions="{ position: 'top' }"
              />
            </div>
          </template>
        </DataTable>
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
import { onMounted } from 'vue'
import { useEdgeRegion } from '../../../composables/useEdgeRegion'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

// Get edge region functionality from composable
const { 
  types,
  loading,
  fetchTypes,
  formatDate,
  deleteType,
  navigateToTypeList,
  navigateToTypeDetail,
  navigateToTypeEdit,
  navigateToTypeCreate
} = useEdgeRegion()

// Get delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Table columns definition
const columns = [
  { field: 'type', header: 'Name', sortable: true },
  { field: 'code', header: 'Code', sortable: true },
  { field: 'description', header: 'Description', sortable: true },
  { field: 'created', header: 'Created', sortable: true }
]

// Fetch edge regions on component mount
onMounted(async () => {
  await fetchTypes()
})

// Handle delete button click
const handleDeleteClick = (type) => {
  confirmDelete(type, 'edge region', 'type')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!deleteDialog.value.item) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteType(
    deleteDialog.value.item.id, 
    deleteDialog.value.item.type
  )
  
  if (success) {
    // Remove the deleted item from the list
    const index = types.value.findIndex(t => t.id === deleteDialog.value.item.id)
    if (index !== -1) {
      types.value.splice(index, 1)
    }
    resetDeleteDialog()
  } else {
    updateDeleteDialog({ loading: false })
  }
}
</script>

<style scoped>
/* Basic DataTable styling */
:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
  cursor: pointer;
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
  color: var(--primary-200);
}

:deep(.dark .p-button-text:hover) {
  background: rgba(var(--primary-200-rgb), 0.16);
}
</style>
