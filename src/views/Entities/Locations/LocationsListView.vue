<template>
  <div>
    <PageHeader title="Locations" subtitle="Manage your physical locations">
      <template #actions>
        <Button 
          label="Create Location" 
          icon="pi pi-plus" 
          @click="navigateToLocationCreate()" 
        />
      </template>
    </PageHeader>
    
    <div class="card">
      <DataTable
        :items="locations"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['code', 'name', 'path', 'type', 'expand.edge_id.code']"
        title="Physical Locations"
        empty-message="No locations found"
                  @row-click="(data) => navigateToLocationDetail(data.id)"
        :paginated="true"
        :rows="10"
      >
        <!-- Table action buttons -->
        <template #table-actions>
          <Button 
            label="Create Location" 
            icon="pi pi-plus" 
            @click="navigateToLocationCreate()" 
          />
        </template>
        
        <!-- Code column with custom formatting -->
        <template #code-body="{ data }">
          <div class="font-medium text-primary-700">{{ data.code }}</div>
        </template>
        
        <!-- Path column with hierarchical display -->
        <template #path-body="{ data }">
          <div class="flex items-center">
            <span v-for="(segment, index) in parseLocationPath(data.path)" :key="index" class="flex items-center">
              <span v-if="index > 0" class="text-gray-400 mx-1">/</span>
              <span class="text-gray-600">{{ segment }}</span>
            </span>
          </div>
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
        
        <!-- Edge column with code -->
        <template #edge_id-body="{ data }">
          <router-link 
            v-if="data.expand && data.expand.edge_id"
            :to="{ name: 'edge-detail', params: { id: data.edge_id } }"
            class="text-primary-600 hover:underline flex items-center"
            @click.stop
          >
            {{ data.expand.edge_id.code }}
          </router-link>
          <span v-else class="text-gray-500">Unknown Edge</span>
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
              @click.stop="navigateToLocationDetail(data.id)"
              tooltip="View"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-pencil" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToLocationEdit(data.id)"
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
import { useRoute } from 'vue-router'
import { useLocation } from '../../../composables/useLocation'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const route = useRoute()

// Get location functionality from composable
const { 
  locations,
  loading,
  fetchLocations,
  formatDate,
  getTypeName,
  getTypeClass,
  parseLocationPath,
  navigateToLocationCreate,
  navigateToLocationDetail,
  navigateToLocationEdit
} = useLocation()

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
  { field: 'path', header: 'Path', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'edge_id', header: 'Edge', sortable: true },
  { field: 'created', header: 'Created', sortable: true }
]

// Fetch locations on component mount
onMounted(async () => {
  // Check if filtering by edge_id from query params
  const params = {}
  if (route.query.edge) {
    params.edge_id = route.query.edge
  }
  
  await fetchLocations(params)
})

// Handle delete button click
const handleDeleteClick = (location) => {
  confirmDelete(location, 'location', 'code')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!deleteDialog.value.item) return
  
  updateDeleteDialog({ loading: true })
  
  const { deleteLocation } = useLocation()
  const success = await deleteLocation(
    deleteDialog.value.item.id, 
    deleteDialog.value.item.code
  )
  
  if (success) {
    // Remove the deleted item from the list
    const index = locations.value.findIndex(l => l.id === deleteDialog.value.item.id)
    if (index !== -1) {
      locations.value.splice(index, 1)
    }
    resetDeleteDialog()
  } else {
    updateDeleteDialog({ loading: false })
  }
}
</script>
