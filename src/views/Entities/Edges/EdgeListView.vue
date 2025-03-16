<template>
  <div>
    <PageHeader title="Edges" subtitle="Manage your edge installations">
      <template #actions>
        <Button 
          label="Create Edge" 
          icon="pi pi-plus" 
          @click="navigateToCreate"
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
        @row-click="navigateToDetail"
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
      title="Delete Edge"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete edge '${deleteDialog.item?.code || ''}'?`"
      details="This action cannot be undone. All associated locations and things will be deleted as well."
      @confirm="deleteEdge"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { edgeService, edgeTypes, edgeRegions } from '../../../services/edge'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()

// Data
const edges = ref([])
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
  { field: 'type', header: 'Type', sortable: true },
  { field: 'region', header: 'Region', sortable: true },
  { field: 'active', header: 'Status', sortable: true },
  { field: 'description', header: 'Description', sortable: false }
]

// Fetch edges on component mount
onMounted(async () => {
  await fetchEdges()
})

// Methods
const fetchEdges = async () => {
  loading.value = true
  try {
    const response = await edgeService.getEdges()
    edges.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching edges:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load edges',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const navigateToCreate = () => {
  router.push({ name: 'create-edge' })
}

const navigateToDetail = (data) => {
  router.push({ name: 'edge-detail', params: { id: data.id } })
}

const navigateToEdit = (data) => {
  router.push({ name: 'edit-edge', params: { id: data.id } })
}

const confirmDelete = (data) => {
  deleteDialog.value.item = data
  deleteDialog.value.visible = true
}

const deleteEdge = async () => {
  if (!deleteDialog.value.item) return
  
  deleteDialog.value.loading = true
  try {
    await edgeService.deleteEdge(deleteDialog.value.item.id)
    
    // Remove the deleted item from the list
    edges.value = edges.value.filter(item => item.id !== deleteDialog.value.item.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Edge ${deleteDialog.value.item.code} has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
  } catch (error) {
    console.error('Error deleting edge:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete edge',
      life: 3000
    })
  } finally {
    deleteDialog.value.loading = false
  }
}

// Helper methods for formatting
const getTypeName = (typeCode) => {
  const type = edgeTypes.find(t => t.value === typeCode)
  return type ? type.label : typeCode
}

const getRegionName = (regionCode) => {
  const region = edgeRegions.find(r => r.value === regionCode)
  return region ? region.label : regionCode
}

const getTypeClass = (typeCode) => {
  switch (typeCode) {
    case 'bld': return 'bg-blue-100 text-blue-800'
    case 'dc': return 'bg-purple-100 text-purple-800'
    case 'wh': return 'bg-amber-100 text-amber-800'
    case 'camp': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getRegionClass = (regionCode) => {
  switch (regionCode) {
    case 'na': return 'bg-red-100 text-red-800'
    case 'eu': return 'bg-blue-100 text-blue-800'
    case 'ap': return 'bg-green-100 text-green-800'
    case 'sa': return 'bg-yellow-100 text-yellow-800'
    case 'af': return 'bg-orange-100 text-orange-800'
    case 'me': return 'bg-purple-100 text-purple-800'
    case 'aus': return 'bg-teal-100 text-teal-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
