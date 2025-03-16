<template>
  <div>
    <PageHeader title="Locations" subtitle="Manage your physical locations">
      <template #actions>
        <Button 
          label="Create Location" 
          icon="pi pi-plus" 
          @click="navigateToCreate"
        />
      </template>
    </PageHeader>
    
    <div class="card">
      <DataTable
        :items="locations"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['code', 'name', 'path', 'type', 'edge.code']"
        title="Physical Locations"
        empty-message="No locations found"
        @row-click="navigateToDetail"
      >
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
        
        <!-- Edge column with reference -->
        <template #edge_id-body="{ data }">
          <router-link 
            :to="{ name: 'edge-detail', params: { id: data.edge_id } }"
            class="text-primary-600 hover:underline flex items-center"
            @click.stop
          >
            {{ data.edge?.code || data.edge_id }}
          </router-link>
        </template>
        
        <!-- Actions column -->
        <template #actions="{ data }">
          <div class="flex gap-1 justify-center">
            <Button 
              icon="pi pi-eye" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToDetail(data)"
              tooltip="View"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-pencil" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToEdit(data)"
              tooltip="Edit"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-rounded p-button-text p-button-sm p-button-danger" 
              @click.stop="confirmDelete(data)"
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
      title="Delete Location"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete location '${deleteDialog.item?.code || ''}'?`"
      details="This action cannot be undone. All things associated with this location will be orphaned or deleted."
      @confirm="deleteLocation"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { locationService, locationTypes, parseLocationPath } from '../../../services/location'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Data
const locations = ref([])
const loading = ref(false)
const deleteDialog = ref({
  visible: false,
  loading: false,
  item: null
})

// Table columns definition
const columns = [
  { field: 'code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'path', header: 'Path', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'edge_id', header: 'Edge', sortable: true },
]

// Fetch locations on component mount
onMounted(async () => {
  await fetchLocations()
})

// Methods
const fetchLocations = async () => {
  loading.value = true
  try {
    // Check if filtering by edge_id from query params
    const params = {}
    if (route.query.edge) {
      params.edge_id = route.query.edge
    }
    
    const response = await locationService.getLocations(params)
    locations.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching locations:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load locations',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const navigateToCreate = () => {
  // Pass edge_id as a query parameter if it was in the original request
  const query = route.query.edge ? { edge_id: route.query.edge } : {}
  router.push({ name: 'create-location', query })
}

const navigateToDetail = (data) => {
  router.push({ name: 'location-detail', params: { id: data.id } })
}

const navigateToEdit = (data) => {
  router.push({ name: 'edit-location', params: { id: data.id } })
}

const confirmDelete = (data) => {
  deleteDialog.value.item = data
  deleteDialog.value.visible = true
}

const deleteLocation = async () => {
  if (!deleteDialog.value.item) return
  
  deleteDialog.value.loading = true
  try {
    await locationService.deleteLocation(deleteDialog.value.item.id)
    
    // Remove the deleted item from the list
    locations.value = locations.value.filter(item => item.id !== deleteDialog.value.item.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Location ${deleteDialog.value.item.code} has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
  } catch (error) {
    console.error('Error deleting location:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete location',
      life: 3000
    })
  } finally {
    deleteDialog.value.loading = false
  }
}

// Helper methods for formatting
const getTypeName = (typeCode) => {
  const type = locationTypes.find(t => t.value === typeCode)
  return type ? type.label : typeCode
}

const getTypeClass = (typeCode) => {
  switch (typeCode) {
    case 'entrance': return 'bg-blue-100 text-blue-800'
    case 'work-area': return 'bg-green-100 text-green-800'
    case 'meeting-room': return 'bg-purple-100 text-purple-800'
    case 'break-area': return 'bg-amber-100 text-amber-800'
    case 'reception': return 'bg-indigo-100 text-indigo-800'
    case 'security': return 'bg-red-100 text-red-800'
    case 'server-room': return 'bg-cyan-100 text-cyan-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
