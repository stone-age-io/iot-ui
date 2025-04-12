<template>
  <div>
    <PageHeader title="Edge Types" subtitle="Manage edge type definitions">
      <template #actions>
        <Button 
          label="Create Edge Type" 
          icon="pi pi-plus" 
          @click="navigateToTypeCreate" 
        />
      </template>
    </PageHeader>
    
    <div class="card">
      <DataTable
        :items="types"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['code', 'type', 'description']"
        title="Edge Types"
        empty-message="No edge types found"
        @row-click="(data) => navigateToTypeDetail(data.id)"
        :paginated="true"
        :rows="10"
      >
        <!-- Table action buttons -->
        <template #table-actions>
          <Button 
            label="Create Edge Type" 
            icon="pi pi-plus" 
            @click="navigateToTypeCreate" 
          />
        </template>
        
        <!-- Code column with custom formatting -->
        <template #code-body="{ data }">
          <div class="font-mono text-primary-700">{{ data.code }}</div>
        </template>
        
        <!-- Type name column -->
        <template #type-body="{ data }">
          <div class="font-medium">{{ data.type }}</div>
        </template>
        
        <!-- Description column with truncation -->
        <template #description-body="{ data }">
          <div class="truncate max-w-md" :title="data.description">
            {{ data.description || 'No description' }}
          </div>
        </template>
        
        <!-- Created date column -->
        <template #created-body="{ data }">
          <div class="text-sm text-gray-600">
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
import { onMounted } from 'vue'
import { useEdgeType } from '../../../composables/useEdgeType'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTypesStore } from '../../../stores/types' 
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

// Get the types store
const typesStore = useTypesStore()

// Edge type functionality from composable
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
} = useEdgeType()

// Delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Table columns definition
const columns = [
  { field: 'code', header: 'Code', sortable: true },
  { field: 'type', header: 'Name', sortable: true },
  { field: 'description', header: 'Description', sortable: true },
  { field: 'created', header: 'Created', sortable: true }
]

// Fetch edge types on component mount
onMounted(async () => {
  await fetchTypes()
  
  // Also update the types store
  typesStore.loadEdgeTypes()
})

// Handle delete button click
const handleDeleteClick = (type) => {
  confirmDelete(type, 'edge type', 'type')
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
    
    // Refresh the types store to get updated list
    typesStore.resetTypes()
    typesStore.loadEdgeTypes()
    
    resetDeleteDialog()
  } else {
    updateDeleteDialog({ loading: false })
  }
}
</script>
