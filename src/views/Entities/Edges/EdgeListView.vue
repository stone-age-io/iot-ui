<template>
  <div>
    <PageHeader title="Edges" subtitle="Manage your edge installations">
      <template #actions>
        <Button 
          label="Create Edge" 
          icon="pi pi-plus" 
          @click="navigateToEdgeCreate" 
        />
      </template>
    </PageHeader>
    
    <div class="card">
      <DataTable
        :items="edges"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['code', 'name', 'description', 'type', 'region']"
        title="Edge Installations"
        empty-message="No edges found"
        @row-click="navigateToEdgeDetail"
        :paginated="true"
        :rows="10"
      >
        <!-- Code column with custom formatting -->
        <template #code-body="{ data }">
          <div class="font-medium text-primary-700">{{ data.code }}</div>
        </template>
        
        <!-- Type column with badge -->
        <template #type-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getTypeClass(data.type)"
          >
            {{ getTypeName(data.type) }}
          </span>
        </template>
        
        <!-- Region column with badge -->
        <template #region-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getRegionClass(data.region)"
          >
            {{ getRegionName(data.region) }}
          </span>
        </template>
        
        <!-- Metadata column with simple visualization -->
        <template #metadata-body="{ data }">
          <div v-if="data.metadata && Object.keys(data.metadata).length > 0">
            <div class="flex items-center">
              <i class="pi pi-info-circle text-primary-500 mr-1"></i>
              <span class="text-sm">{{ getMetadataSummary(data.metadata) }}</span>
            </div>
          </div>
          <span v-else class="text-gray-500 text-sm">No metadata</span>
        </template>
        
        <!-- Status column with badge -->
        <template #active-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="data.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
          >
            {{ data.active ? 'Active' : 'Inactive' }}
          </span>
        </template>
        
        <!-- Created date column -->
        <template #created-body="{ data }">
          <div class="text-sm text-gray-600">
            {{ formatDate(data.created) }}
          </div>
        </template>
        
        <!-- Actions column -->
        <template #actions="{ data }">
          <div class="flex gap-1 justify-center">
            <Button 
              icon="pi pi-eye" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToEdgeDetail(data.id)"
              tooltip="View"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-pencil" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToEdgeEdit(data.id)"
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
import { useEdge } from '../../../composables/useEdge'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

// Get edge functionality from composable
const { 
  edges,
  loading,
  fetchEdges,
  formatDate,
  getTypeName,
  getRegionName,
  getTypeClass,
  getRegionClass,
  getMetadataSummary,
  deleteEdge,
  navigateToEdgeCreate,
  navigateToEdgeDetail,
  navigateToEdgeEdit
} = useEdge()

// Get delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Table columns definition
const columns = [
  { field: 'code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'region', header: 'Region', sortable: true },
  { field: 'active', header: 'Status', sortable: true },
  { field: 'metadata', header: 'Metadata', sortable: false },
  { field: 'created', header: 'Created', sortable: true },
  { field: 'actions', header: 'Actions', sortable: false }
]

// Fetch edges on component mount
onMounted(async () => {
  await fetchEdges()
})

// Handle delete button click
const handleDeleteClick = (edge) => {
  confirmDelete(edge, 'edge')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!deleteDialog.value.item) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteEdge(
    deleteDialog.value.item.id, 
    deleteDialog.value.item.code
  )
  
  if (success) {
    // Remove the deleted item from the list
    const index = edges.value.findIndex(e => e.id === deleteDialog.value.item.id)
    if (index !== -1) {
      edges.value.splice(index, 1)
    }
    resetDeleteDialog()
  } else {
    updateDeleteDialog({ loading: false })
  }
}
</script>
