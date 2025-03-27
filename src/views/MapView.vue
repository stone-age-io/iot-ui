<!-- src/views/MapView.vue -->
<template>
  <div class="map-view p-4">
    <!-- Header with Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2 sm:gap-0">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Locations Map</h1>
        <p class="text-gray-600 mt-1">Geographic view of all edges and locations</p>
      </div>
      
      <div class="flex flex-wrap gap-2 items-center">
        <!-- Edge Filter -->
        <Dropdown
          v-model="selectedEdge"
          :options="edgeOptions"
          optionLabel="label"
          placeholder="All Edges"
          class="w-full sm:w-auto"
          :disabled="loading"
          @change="filterByEdge"
        />
        
        <!-- Type Filter -->
        <Dropdown
          v-model="selectedType"
          :options="locationTypeOptions"
          optionLabel="label"
          placeholder="All Types"
          class="w-full sm:w-auto"
          :disabled="loading"
          @change="filterByType"
        />
      </div>
    </div>
    
    <!-- Map Card -->
    <DashboardCard class="mb-6" no-padding>
      <div class="map-container relative" :style="{ height: '70vh' }">
        <!-- Loading Overlay -->
        <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <ProgressSpinner strokeWidth="4" />
        </div>
        
        <!-- Global Map Component -->
        <GlobalMap
          ref="globalMapRef"
          :locations="filteredLocations"
          :edges="edges"
          @location-click="handleLocationClick"
        />
      </div>
    </DashboardCard>
    
    <!-- Location List -->
    <DashboardCard title="Locations">
      <DataTable
        :items="filteredLocations"
        :columns="columns"
        :loading="loading"
        :paginated="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        :searchable="true"
        :searchFields="['name', 'code', 'expand.edge_id.name', 'type']"
        title="Locations"
        empty-message="No locations found. Try adjusting your filters."
        @row-click="navigateToDetail"
      >
        <!-- Name Column Custom Template -->
        <template #name-body="{ data }">
          <div class="flex items-center">
            <i 
              class="pi pi-map-marker mr-2"
              :class="[getIconColorClass(data.type), 'text-lg']"
            ></i>
            <div>
              <div class="font-medium text-sm">{{ data.name }}</div>
              <div class="text-xs text-gray-500">{{ data.code }}</div>
            </div>
          </div>
        </template>
        
        <!-- Type Column Custom Template -->
        <template #type-body="{ data }">
          <span 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="getTypeClass(data.type)"
          >
            {{ getTypeName(data.type) }}
          </span>
        </template>
        
        <!-- Edge Column Custom Template -->
        <template #edge-body="{ data }">
          <div v-if="data.expand && data.expand.edge_id">
            <div class="text-sm">{{ data.expand.edge_id.name }}</div>
            <div class="text-xs text-gray-500">{{ data.expand.edge_id.code }}</div>
          </div>
          <div v-else class="text-gray-400 text-sm">No edge</div>
        </template>
        
        <!-- Path Column Custom Template -->
        <template #path-body="{ data }">
          <div class="text-sm">{{ formatPath(data.path) }}</div>
        </template>
        
        <!-- Coordinates Column Custom Template -->
        <template #coordinates-body="{ data }">
          <div v-if="hasCoordinates(data)" class="text-sm">
            {{ formatCoordinates(data) }}
          </div>
          <div v-else class="text-gray-400 text-sm">No coordinates</div>
        </template>
        
        <!-- Row Actions Template -->
        <template #row-actions="{ data }">
          <div class="flex gap-2 justify-center">
            <Button 
              icon="pi pi-search"
              class="p-button-rounded p-button-text p-button-sm"
              @click.stop="locateOnMap(data)"
              tooltip="Locate on map"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-pencil"
              class="p-button-rounded p-button-text p-button-sm"
              @click.stop="navigateToEdit(data.id)"
              tooltip="Edit location"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-external-link"
              class="p-button-rounded p-button-text p-button-sm"
              @click.stop="navigateToDetail(data.id)"
              tooltip="View details"
              tooltipOptions="{ position: 'top' }"
            />
          </div>
        </template>
      </DataTable>
    </DashboardCard>
    
    <!-- Location Detail Dialog -->
    <Dialog
      v-model:visible="locationDialog.visible"
      :header="locationDialog.title"
      :style="{ width: '90%', maxWidth: '600px' }"
      :modal="true"
      :closable="true"
      :closeOnEscape="true"
    >
      <div v-if="locationDialog.location">
        <div class="mb-4">
          <span 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
            :class="getTypeClass(locationDialog.location.type)"
          >
            {{ getTypeName(locationDialog.location.type) }}
          </span>
          <p class="text-sm text-gray-500 mb-1">{{ locationDialog.location.code }}</p>
          <p class="text-sm text-gray-600 mb-3">{{ formatPath(locationDialog.location.path) }}</p>
          
          <div v-if="locationDialog.location.description" class="text-sm mt-2 text-gray-700">
            {{ locationDialog.location.description }}
          </div>
          
          <div v-if="getEdgeName(locationDialog.location)" class="mt-4 p-3 bg-gray-50 rounded">
            <p class="text-sm font-medium text-gray-700">Edge</p>
            <p class="text-sm text-gray-600">{{ getEdgeName(locationDialog.location) }}</p>
          </div>
        </div>
        
        <template v-if="hasCoordinates(locationDialog.location)">
          <h3 class="font-medium text-gray-700 mb-2 mt-4">Coordinates</h3>
          <p class="text-sm text-gray-600">{{ formatCoordinates(locationDialog.location) }}</p>
        </template>
        
        <div class="flex justify-end gap-2 mt-6">
          <Button
            label="Edit Location"
            class="p-button-outlined"
            icon="pi pi-pencil"
            @click="navigateToEdit(locationDialog.location.id)"
          />
          <Button
            label="View Details"
            icon="pi pi-external-link"
            @click="navigateToDetail(locationDialog.location.id)"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from 'primevue/api'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

// Import from new service structure
import { 
  locationService, 
  locationTypes, 
  edgeService
} from '../services'

// Import components
import DashboardCard from '../components/dashboard/DashboardCard.vue'
import GlobalMap from '../components/map/GlobalMap.vue'
import DataTable from '../components/common/DataTable.vue'

const router = useRouter()
const globalMapRef = ref(null)

// Data
const locations = ref([])
const edges = ref([])
const loading = ref(true)

// Filters
const selectedEdge = ref(null)
const selectedType = ref(null)
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

// Location dialog
const locationDialog = ref({
  visible: false,
  location: null,
  title: 'Location Details'
})

// Define table columns
const columns = [
  { field: 'name', header: 'Name', sortable: true, style: { minWidth: '14rem' } },
  { field: 'type', header: 'Type', sortable: true, style: { minWidth: '10rem' } },
  { field: 'edge', header: 'Edge', sortable: true, style: { minWidth: '10rem' } },
  { field: 'path', header: 'Path', sortable: true, style: { minWidth: '12rem' } },
  { field: 'coordinates', header: 'Coordinates', sortable: false, style: { minWidth: '10rem' } }
]

// Computed properties
const edgeOptions = computed(() => {
  return [
    { label: 'All Edges', value: null },
    ...edges.value.map(edge => ({
      label: edge.name,
      value: edge.id
    }))
  ]
})

const locationTypeOptions = computed(() => {
  return [
    { label: 'All Types', value: null },
    ...locationTypes.map(type => ({
      label: type.label,
      value: type.value
    }))
  ]
})

const filteredLocations = computed(() => {
  let result = [...locations.value]
  
  if (selectedEdge.value) {
    result = result.filter(loc => loc.edge_id === selectedEdge.value.value)
  }
  
  if (selectedType.value) {
    result = result.filter(loc => loc.type === selectedType.value.value)
  }
  
  return result
})

// Fetch data on component mount
onMounted(async () => {
  await Promise.all([
    fetchLocations(),
    fetchEdges()
  ])
})

// Watch for filter changes
watch([selectedEdge, selectedType], () => {
  // Refresh the map markers when filters change
  if (globalMapRef.value) {
    // Allow time for computed to update
    setTimeout(() => {
      globalMapRef.value.centerMapToAllLocations()
    }, 100)
  }
})

// Fetch location data
const fetchLocations = async () => {
  loading.value = true
  try {
    const response = await locationService.getLocations({
      expand: 'edge_id',
      sort: 'name',
      limit: 100 // Get more items for the map view
    })
    
    locations.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching locations:', error)
  } finally {
    loading.value = false
  }
}

// Fetch edge data
const fetchEdges = async () => {
  try {
    const response = await edgeService.getEdges({
      sort: 'name'
    })
    
    edges.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching edges:', error)
  }
}

// Filter handlers
const filterByEdge = () => {
  // Filter is applied via computed property
}

const filterByType = () => {
  // Filter is applied via computed property
}

// Map event handlers
const handleLocationClick = (location) => {
  locationDialog.value.location = location
  locationDialog.value.title = location.name
  locationDialog.value.visible = true
}

const locateOnMap = (location) => {
  if (globalMapRef.value && hasCoordinates(location)) {
    // Center map on the location
    const coordinates = getCoordinates(location)
    globalMapRef.value.centerMapToLocation(coordinates)
    
    // Simulate a click to show the marker popup
    setTimeout(() => {
      const marker = globalMapRef.value.findMarkerById(location.id)
      if (marker) {
        marker.openPopup()
      }
    }, 300)
  }
}

// Helper functions
const hasCoordinates = (location) => {
  return location && 
         location.metadata && 
         location.metadata.coordinates && 
         location.metadata.coordinates.lat && 
         (location.metadata.coordinates.lng || location.metadata.coordinates.long)
}

const getCoordinates = (location) => {
  if (!hasCoordinates(location)) return null
  
  return {
    lat: location.metadata.coordinates.lat,
    lng: location.metadata.coordinates.lng || location.metadata.coordinates.long
  }
}

const formatCoordinates = (location) => {
  if (!hasCoordinates(location)) return 'N/A'
  
  const coords = location.metadata.coordinates
  const lat = coords.lat.toFixed(6)
  const lng = (coords.lng || coords.long).toFixed(6)
  
  return `${lat}, ${lng}`
}

const formatPath = (path) => {
  if (!path) return ''
  return path.split('/').join(' > ')
}

const getTypeName = (type) => {
  const locationType = locationTypes.find(t => t.value === type)
  return locationType ? locationType.label : type
}

const getTypeClass = (type) => {
  const classes = {
    'entrance': 'bg-blue-100 text-blue-800',
    'work-area': 'bg-green-100 text-green-800',
    'meeting-room': 'bg-purple-100 text-purple-800',
    'break-area': 'bg-amber-100 text-amber-800',
    'reception': 'bg-indigo-100 text-indigo-800',
    'security': 'bg-red-100 text-red-800',
    'server-room': 'bg-cyan-100 text-cyan-800',
    'utility-room': 'bg-teal-100 text-teal-800',
    'storage': 'bg-gray-100 text-gray-800',
    'entrance-hall': 'bg-blue-100 text-blue-800'
  }
  
  return classes[type] || 'bg-gray-100 text-gray-800'
}

const getIconColorClass = (type) => {
  const classes = {
    'entrance': 'text-blue-600',
    'work-area': 'text-green-600',
    'meeting-room': 'text-purple-600',
    'break-area': 'text-amber-600',
    'reception': 'text-indigo-600',
    'security': 'text-red-600',
    'server-room': 'text-cyan-600',
    'utility-room': 'text-teal-600',
    'storage': 'text-gray-600',
    'entrance-hall': 'text-blue-600'
  }
  
  return classes[type] || 'text-gray-600'
}

const getEdgeName = (location) => {
  if (!location.edge_id) return null
  
  if (location.expand && location.expand.edge_id) {
    return location.expand.edge_id.name
  }
  
  const edge = edges.value.find(e => e.id === location.edge_id)
  return edge ? edge.name : 'Unknown Edge'
}

// Navigation helpers
const navigateToDetail = (id) => {
  if (typeof id === 'object' && id !== null) {
    id = id.id;
  }
  locationDialog.value.visible = false
  router.push({ name: 'location-detail', params: { id } })
}

const navigateToEdit = (id) => {
  locationDialog.value.visible = false
  router.push({ name: 'edit-location', params: { id } })
}
</script>

<style scoped>
.map-view {
  max-width: 1600px;
  margin: 0 auto;
}

:deep(.map-container) {
  overflow: hidden;
  border-radius: 0.5rem;
}
</style>
