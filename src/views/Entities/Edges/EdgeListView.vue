<template>
  <div>
    <PageHeader title="Edges" subtitle="Manage your edge installations">
      <template #actions>
        <Button 
          label="Create Edge" 
          icon="pi pi-plus" 
          @click="handleCreateClick" 
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
        @row-click="(data) => navigateToEdgeDetail(data.id)"
        :paginated="true"
        :rows="10"
      >
        <!-- Code column with custom formatting -->
        <template #code-body="{ data }">
          <div class="font-medium text-primary-700 dark:text-primary-400">{{ data.code }}</div>
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
        
        <!-- Status column with badge -->
        <template #active-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="data.active ? 
              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
          >
            {{ data.active ? 'Active' : 'Inactive' }}
          </span>
        </template>
        
        <!-- Created date column -->
        <template #created-body="{ data }">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ formatDate(data.created) }}
          </div>
        </template>
        
        <!-- Row actions -->
        <template #row-actions="{ data }">
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
import { useRouter } from 'vue-router'
import { useEdge } from '../../../composables/useEdge'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()

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
  deleteEdge,
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

// Table columns definition with width styles to ensure proper column widths
const columns = [
  { field: 'code', header: 'Code', sortable: true, style: 'min-width: 10rem' },
  { field: 'name', header: 'Name', sortable: true, style: 'min-width: 12rem' },
  { field: 'type', header: 'Type', sortable: true, style: 'min-width: 8rem' },
  { field: 'region', header: 'Region', sortable: true, style: 'min-width: 8rem' },
  { field: 'active', header: 'Status', sortable: true, style: 'min-width: 8rem' },
  { field: 'created', header: 'Created', sortable: true, style: 'min-width: 10rem' }
]

// Fetch edges on component mount
onMounted(async () => {
  await fetchEdges()
})

// Handle create button click - use router directly to avoid passing event as query
const handleCreateClick = () => {
  router.push({ name: 'create-edge' })
}

// Handle delete button click
const handleDeleteClick = (edge) => {
  confirmDelete(edge, 'Edge')
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

<style>
/* Ensure edge type and region badges get proper dark mode styling */
.bg-blue-100.text-blue-800 {
  @apply dark:bg-blue-900/30 dark:text-blue-300;
}

.bg-purple-100.text-purple-800 {
  @apply dark:bg-purple-900/30 dark:text-purple-300;
}

.bg-green-100.text-green-800 {
  @apply dark:bg-green-900/30 dark:text-green-300;
}

.bg-amber-100.text-amber-800 {
  @apply dark:bg-amber-900/30 dark:text-amber-300;
}

.bg-red-100.text-red-800 {
  @apply dark:bg-red-900/30 dark:text-red-300;
}

.bg-gray-100.text-gray-800 {
  @apply dark:bg-gray-700 dark:text-gray-300;
}
</style>
