<template>
  <div>
    <PageHeader title="Location Types" subtitle="Manage your location type definitions">
      <template #actions>
        <Button 
          label="Create Location Type" 
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
        :searchFields="['type', 'code', 'description']"
        title="Location Types"
        empty-message="No location types found"
        @row-click="(data) => navigateToTypeDetail(data.id)"
        :paginated="true"
        :rows="10"
      >
        <!-- Table action buttons -->
        <template #table-actions>
          <Button 
            label="Create Location Type" 
            icon="pi pi-plus" 
            @click="navigateToTypeCreate" 
          />
        </template>
        
        <!-- Type column -->
        <template #type-body="{ data }">
          <div class="font-medium text-primary-700">{{ data.type }}</div>
        </template>
        
        <!-- Code column -->
        <template #code-body="{ data }">
          <span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{{ data.code }}</span>
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
import { useLocationType } from '../../../composables/useLocationType'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

// Get location type functionality from composable
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
} = useLocationType()

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

// Fetch location types on component mount
onMounted(async () => {
  await fetchTypes()
})

// Handle delete button click
const handleDeleteClick = (type) => {
  confirmDelete(type, 'location type', 'type')
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
