<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner strokeWidth="4" />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="card p-6 text-center">
      <div class="text-red-500 text-xl mb-4">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load edge details
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Edge Details -->
    <div v-else-if="edge">
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">Edge Installation</div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ edge.name }}</h1>
          <div class="text-gray-600">
            <span class="font-mono">{{ edge.code }}</span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToEdit"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="confirmDelete"
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="card lg:col-span-2">
          <h2 class="text-xl font-semibold mb-4">Edge Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Code -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Code</div>
              <div class="font-mono text-lg">{{ edge.code }}</div>
            </div>
            
            <!-- Name -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Name</div>
              <div class="text-lg">{{ edge.name }}</div>
            </div>
            
            <!-- Type -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Type</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="getTypeClass(edge.type)"
                >
                  {{ getTypeName(edge.type) }}
                </span>
              </div>
            </div>
            
            <!-- Region -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Region</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="getRegionClass(edge.region)"
                >
                  {{ getRegionName(edge.region) }}
                </span>
              </div>
            </div>
            
            <!-- Status -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Status</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="edge.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ edge.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Description</div>
              <div class="text-gray-700">{{ edge.description || 'No description provided' }}</div>
            </div>
          </div>
        </div>
        
        <!-- Stats/Quick Info Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Overview</h2>
          
          <div class="space-y-6">
            <!-- Locations Count -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Locations</div>
              <div class="flex items-center">
                <i class="pi pi-map-marker text-green-600 mr-2"></i>
                <div class="text-2xl font-semibold">{{ stats.locationsCount }}</div>
              </div>
              <Button
                label="View Locations"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm mt-2"
                @click="navigateToLocations"
              />
            </div>
            
            <!-- Things Count -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Things</div>
              <div class="flex items-center">
                <i class="pi pi-wifi text-purple-600 mr-2"></i>
                <div class="text-2xl font-semibold">{{ stats.thingsCount }}</div>
              </div>
              <Button
                label="View Things"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm mt-2"
                @click="navigateToThings"
              />
            </div>
            
            <!-- Created Date -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Created</div>
              <div class="text-gray-700">{{ formatDate(edge.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Last Updated</div>
              <div class="text-gray-700">{{ formatDate(edge.updated) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Graph Link Card -->
      <div class="card mt-6">
        <div class="flex items-center">
          <div class="flex-1">
            <h2 class="text-xl font-semibold mb-1">Analytics & Monitoring</h2>
            <p class="text-gray-600">View detailed metrics and logs for this edge in Grafana.</p>
          </div>
          <Button
            label="Open in Grafana"
            icon="pi pi-external-link"
            @click="openInGrafana"
          />
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:visible="deleteDialog.visible"
      title="Delete Edge"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete edge '${edge?.code || ''}'?`"
      details="This action cannot be undone. All associated locations and things will be deleted as well."
      @confirm="deleteEdge"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { edgeService, edgeTypes, edgeRegions } from '../../../services/edge'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Data
const edge = ref(null)
const loading = ref(true)
const error = ref(null)
const deleteDialog = ref({
  visible: false,
  loading: false
})

// Mock stats (in a real app, these would come from the API)
const stats = ref({
  locationsCount: 0,
  thingsCount: 0
})

// Fetch edge data on component mount
onMounted(async () => {
  await fetchEdge()
})

// Methods
const fetchEdge = async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Invalid edge ID'
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const response = await edgeService.getEdge(id)
    edge.value = response.data
    
    // In a real application, fetch associated stats
    // For now, using mock data
    stats.value = {
      locationsCount: Math.floor(Math.random() * 10) + 1,
      thingsCount: Math.floor(Math.random() * 30) + 5
    }
  } catch (err) {
    console.error('Error fetching edge:', err)
    error.value = 'Failed to load edge details. Please try again.'
  } finally {
    loading.value = false
  }
}

const navigateToEdit = () => {
  router.push({ name: 'edit-edge', params: { id: edge.value.id } })
}

const confirmDelete = () => {
  deleteDialog.value.visible = true
}

const deleteEdge = async () => {
  deleteDialog.value.loading = true
  try {
    await edgeService.deleteEdge(edge.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Edge ${edge.value.code} has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
    router.push({ name: 'edges' })
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

const navigateToLocations = () => {
  // In a real app, you might want to filter locations by edge
  router.push({ name: 'locations', query: { edge: edge.value.id } })
}

const navigateToThings = () => {
  // In a real app, you might want to filter things by edge
  router.push({ name: 'things', query: { edge: edge.value.id } })
}

const openInGrafana = () => {
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'https://grafana.domain.com'
  const dashboardUrl = `${grafanaUrl}/d/edge-overview/edge-overview?var-edge_id=${edge.value.id}`
  window.open(dashboardUrl, '_blank')
}

// Helper methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return dayjs(dateString).format('MMM D, YYYY HH:mm')
}

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
