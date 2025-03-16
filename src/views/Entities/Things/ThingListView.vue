<template>
  <div>
    <PageHeader title="Things" subtitle="Manage your IoT devices and things">
      <template #actions>
        <Button 
          label="Create Thing" 
          icon="pi pi-plus" 
          @click="navigateToCreate"
        />
      </template>
    </PageHeader>
    
    <div class="card">
      <DataTable
        :items="things"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['thing_code', 'name', 'thing_type', 'description']"
        title="IoT Things"
        empty-message="No things found"
        @row-click="navigateToDetail"
      >
        <!-- Code column with custom formatting -->
        <template #thing_code-body="{ data }">
          <div class="font-medium text-primary-700">{{ data.thing_code }}</div>
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
        
        <!-- Location column with reference -->
        <template #location_id-body="{ data }">
          <router-link 
            :to="{ name: 'location-detail', params: { id: data.location_id } }"
            class="text-primary-600 hover:underline flex items-center"
            @click.stop
          >
            {{ data.location?.code || data.location_id }}
          </router-link>
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
      title="Delete Thing"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete thing '${deleteDialog.item?.thing_code || ''}'?`"
      details="This action cannot be undone. All associated data will be deleted as well."
      @confirm="deleteThing"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { thingService, thingTypes } from '../../../services/thing'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Data
const things = ref([])
const loading = ref(false)
const deleteDialog = ref({
  visible: false,
  loading: false,
  item: null
})

// Table columns definition
const columns = [
  { field: 'thing_code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'thing_type', header: 'Type', sortable: true },
  { field: 'location_id', header: 'Location', sortable: true },
  { field: 'active', header: 'Status', sortable: true },
  { field: 'description', header: 'Description', sortable: false }
]

// Fetch things on component mount
onMounted(async () => {
  await fetchThings()
})

// Methods
const fetchThings = async () => {
  loading.value = true
  try {
    // Check if filtering by edge_id or location_id from query params
    const params = {}
    if (route.query.edge) {
      params.edge_id = route.query.edge
    }
    if (route.query.location) {
      params.location_id = route.query.location
    }
    
    const response = await thingService.getThings(params)
    things.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching things:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load things',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const navigateToCreate = () => {
  // Pass edge_id or location_id as query parameters if they were in the original request
  const query = {}
  if (route.query.edge) query.edge_id = route.query.edge
  if (route.query.location) query.location_id = route.query.location
  
  router.push({ name: 'create-thing', query })
}

const navigateToDetail = (data) => {
  router.push({ name: 'thing-detail', params: { id: data.id } })
}

const navigateToEdit = (data) => {
  router.push({ name: 'edit-thing', params: { id: data.id } })
}

const confirmDelete = (data) => {
  deleteDialog.value.item = data
  deleteDialog.value.visible = true
}

const deleteThing = async () => {
  if (!deleteDialog.value.item) return
  
  deleteDialog.value.loading = true
  try {
    await thingService.deleteThing(deleteDialog.value.item.id)
    
    // Remove the deleted item from the list
    things.value = things.value.filter(item => item.id !== deleteDialog.value.item.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Thing ${deleteDialog.value.item.thing_code} has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
  } catch (error) {
    console.error('Error deleting thing:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete thing',
      life: 3000
    })
  } finally {
    deleteDialog.value.loading = false
  }
}

// Helper methods for formatting
const getTypeName = (thingType) => {
  const type = thingTypes.find(t => t.value === thingType)
  return type ? type.label : thingType
}

const getTypeClass = (thingType) => {
  switch (thingType) {
    case 'reader': return 'bg-blue-100 text-blue-800'
    case 'controller': return 'bg-purple-100 text-purple-800'
    case 'lock': return 'bg-amber-100 text-amber-800'
    case 'temperature-sensor': return 'bg-green-100 text-green-800'
    case 'humidity-sensor': return 'bg-cyan-100 text-cyan-800'
    case 'hvac': return 'bg-teal-100 text-teal-800'
    case 'lighting': return 'bg-yellow-100 text-yellow-800'
    case 'camera': return 'bg-red-100 text-red-800'
    case 'motion-sensor': return 'bg-indigo-100 text-indigo-800'
    case 'occupancy-sensor': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
