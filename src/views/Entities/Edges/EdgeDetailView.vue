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
            @click="navigateToEdgeEdit(edge.id)"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="handleDeleteClick"
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
            
            <!-- Metadata (if any) -->
            <div v-if="hasEdgeMetadata" class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Metadata</div>
              <div class="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
                <pre>{{ JSON.stringify(edge.metadata, null, 2) }}</pre>
              </div>
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
                @click="navigateToLocations(edge.id)"
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
                @click="navigateToThings(edge.id)"
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
      
      <!-- Recent Locations -->
      <div class="card mt-6" v-if="recentLocations.length > 0">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Recent Locations</h2>
          <Button
            label="View All"
            icon="pi pi-arrow-right"
            class="p-button-text p-button-sm"
            @click="navigateToLocations(edge.id)"
          />
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="location in recentLocations" 
            :key="location.id"
            class="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="navigateToLocationDetail(location.id)"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="text-primary-600 font-mono">{{ location.code }}</span>
              <span 
                class="px-2 py-1 text-xs rounded-full font-medium"
                :class="getLocationTypeClass(location.type)"
              >
                {{ getLocationTypeName(location.type) }}
              </span>
            </div>
            <div class="font-semibold mb-1">{{ location.name }}</div>
            <div class="text-sm text-gray-500">{{ formatPath(location.path) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Recent Things -->
      <div class="card mt-6" v-if="recentThings.length > 0">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Recent Things</h2>
          <Button
            label="View All"
            icon="pi pi-arrow-right"
            class="p-button-text p-button-sm"
            @click="navigateToThings(edge.id)"
          />
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="thing in recentThings" 
            :key="thing.id"
            class="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="navigateToThingDetail(thing.id)"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="text-primary-600 font-mono">{{ thing.thing_code }}</span>
              <span 
                class="px-2 py-1 text-xs rounded-full font-medium"
                :class="getThingTypeClass(thing.thing_type)"
              >
                {{ getThingTypeName(thing.thing_type) }}
              </span>
            </div>
            <div class="font-semibold mb-1">{{ thing.name }}</div>
            <div class="text-sm text-gray-500">{{ getLocationName(thing.location_id) }}</div>
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
            @click="openInGrafana(edge.id)"
          />
        </div>
      </div>
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
import { useRoute, useRouter } from 'vue-router'
import { useEdge } from '../../../composables/useEdge'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()

// Edge functionality from composable
const { 
  loading, 
  error, 
  formatDate, 
  hasMetadata: hasEdgeMetadata,
  getTypeName, 
  getRegionName, 
  getTypeClass, 
  getRegionClass,
  fetchEdge,
  deleteEdge,
  openInGrafana,
  navigateToEdgeEdit,
  navigateToLocations,
  navigateToThings
} = useEdge()

// Delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Local state
const edge = ref(null)
const recentLocations = ref([])
const recentThings = ref([])
const allLocations = ref({}) // Map of location_id -> location for quick lookups

// Stats based on real data
const stats = computed(() => ({
  locationsCount: recentLocations.value.length,
  thingsCount: recentThings.value.length
}))

// Fetch edge data on component mount
onMounted(async () => {
  await loadEdgeDetail()
})

// Methods
const loadEdgeDetail = async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch edge data
    const edgeData = await fetchEdge(id)
    if (edgeData) {
      edge.value = edgeData
      
      // Now fetch associated locations and things
      await Promise.all([
        fetchLocations(),
        fetchThings()
      ])
    }
  } catch (err) {
    // Error handling is done in the composable
  }
}

// Fetch locations for this edge
const fetchLocations = async () => {
  if (!edge.value) return
  
  try {
    const { locationService } = await import('../../../services')
    const response = await locationService.getLocations({
      edge_id: edge.value.id,
      sort: '-created',
      perPage: 6 // Limit to 6 recent locations
    })
    
    recentLocations.value = response.data.items || []
    
    // Build a lookup map for locations
    recentLocations.value.forEach(loc => {
      allLocations.value[loc.id] = loc
    })
  } catch (err) {
    console.error('Error fetching locations:', err)
  }
}

// Fetch things for this edge
const fetchThings = async () => {
  if (!edge.value) return
  
  try {
    const { thingService } = await import('../../../services')
    const response = await thingService.getThings({
      edge_id: edge.value.id,
      sort: '-created',
      perPage: 6 // Limit to 6 recent things
    })
    
    recentThings.value = response.data.items || []
  } catch (err) {
    console.error('Error fetching things:', err)
  }
}

// Location and thing navigation
const navigateToLocationDetail = (id) => {
  router.push({ name: 'location-detail', params: { id } })
}

const navigateToThingDetail = (id) => {
  router.push({ name: 'thing-detail', params: { id } })
}

// Get location name for a thing
const getLocationName = (locationId) => {
  const location = allLocations.value[locationId]
  return location ? location.name : 'Unknown location'
}

// Format location path for display
const formatPath = (path) => {
  if (!path) return ''
  return path.split('/').join(' > ')
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!edge.value) return
  confirmDelete(edge.value, 'edge')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!edge.value) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteEdge(edge.value.id, edge.value.code)
  
  if (success) {
    resetDeleteDialog()
    router.push({ name: 'edges' })
  } else {
    updateDeleteDialog({ loading: false })
  }
}

// Location & thing type formatting helpers
const getLocationTypeName = async (typeCode) => {
  try {
    const { locationTypes } = await import('../../../services')
    const type = locationTypes.find(t => t.value === typeCode)
    return type ? type.label : typeCode
  } catch (err) {
    return typeCode
  }
}

const getLocationTypeClass = (typeCode) => {
  switch (typeCode) {
    case 'entrance': return 'bg-blue-100 text-blue-800'
    case 'work-area': return 'bg-green-100 text-green-800'
    case 'meeting-room': return 'bg-purple-100 text-purple-800'
    case 'break-area': return 'bg-amber-100 text-amber-800'
    case 'reception': return 'bg-indigo-100 text-indigo-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getThingTypeName = async (typeCode) => {
  try {
    const { thingTypes } = await import('../../../services')
    const type = thingTypes.find(t => t.value === typeCode)
    return type ? type.label : typeCode
  } catch (err) {
    return typeCode
  }
}

const getThingTypeClass = (typeCode) => {
  switch (typeCode) {
    case 'reader': return 'bg-blue-100 text-blue-800'
    case 'controller': return 'bg-purple-100 text-purple-800'
    case 'temperature-sensor': return 'bg-green-100 text-green-800'
    case 'motion-sensor': return 'bg-amber-100 text-amber-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
