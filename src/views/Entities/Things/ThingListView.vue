<template>
  <div>
    <PageHeader title="Things" subtitle="Manage your IoT devices and things">
      <template #actions>
        <Button 
          label="Create Thing" 
          icon="pi pi-plus" 
          @click="navigateToThingCreate(routeQuery)" 
        />
      </template>
    </PageHeader>
    
    <div class="card">
      <DataTable
        :items="things"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['thing_code', 'name', 'thing_type', 'expand.location_id.code', 'expand.edge_id.code']"
        title="Things"
        empty-message="No things found"
        @row-click="(data) => navigateToThingDetail(data.id)"
        :paginated="true"
        :rows="10"
      >
        <!-- Code column with custom formatting -->
        <template #thing_code-body="{ data }">
          <div class="font-medium text-primary-700 font-mono">{{ data.thing_code }}</div>
        </template>
        
        <!-- Type column with badge -->
        <template #thing_type-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getTypeClass(data.thing_type)"
          >
            {{ getTypeName(data.thing_type) }}
          </span>
        </template>
        
        <!-- Location column with code -->
        <template #location_id-body="{ data }">
          <router-link 
            v-if="data.expand && data.expand.location_id"
            :to="{ name: 'location-detail', params: { id: data.location_id } }"
            class="text-primary-600 hover:underline flex items-center"
            @click.stop
          >
            {{ data.expand.location_id.code }}
          </router-link>
          <span v-else class="text-gray-500">Unknown Location</span>
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
        
        <!-- Row actions -->
        <template #row-actions="{ data }">
          <div class="flex gap-1 justify-center">
            <Button 
              icon="pi pi-eye" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToThingDetail(data.id)"
              tooltip="View"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-pencil" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToThingEdit(data.id)"
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThing } from '../../../composables/useThing'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const route = useRoute()

// Get thing functionality from composable
const { 
  things,
  loading,
  fetchThings,
  getTypeName,
  getTypeClass,
  deleteThing,
  navigateToThingCreate,
  navigateToThingDetail,
  navigateToThingEdit
} = useThing()

// Get delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Table columns definition - updated to use correct field names
const columns = [
  { field: 'thing_code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'thing_type', header: 'Type', sortable: true },
  { field: 'location_id', header: 'Location', sortable: true },
  { field: 'edge_id', header: 'Edge', sortable: true }
]

// Computed route query for filtering
const routeQuery = computed(() => {
  const query = {}
  if (route.query.edge) query.edge_id = route.query.edge
  if (route.query.location) query.location_id = route.query.location
  return query
})

// Fetch things on component mount
onMounted(async () => {
  await fetchThings(routeQuery.value)
})

// Handle delete button click
const handleDeleteClick = (thing) => {
  confirmDelete(thing, 'thing', 'thing_code')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!deleteDialog.value.item) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteThing(
    deleteDialog.value.item.id, 
    deleteDialog.value.item.thing_code
  )
  
  if (success) {
    // Remove the deleted item from the list
    const index = things.value.findIndex(t => t.id === deleteDialog.value.item.id)
    if (index !== -1) {
      things.value.splice(index, 1)
    }
    resetDeleteDialog()
  } else {
    updateDeleteDialog({ loading: false })
  }
}
</script>
