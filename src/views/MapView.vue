<!-- src/views/MapView.vue -->
<template>
  <div class="map-view p-4 theme-transition">
    <!-- Header with Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2 sm:gap-0">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-content-primary dark:text-content-primary-dark">Locations Map</h1>
        <p class="text-content-secondary dark:text-content-secondary-dark mt-1">Geographic view of all edges and locations</p>
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
    <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition mb-6">
      <div class="map-container relative" :style="{ height: '70vh' }">
        <!-- Loading Overlay -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center z-10 bg-surface-primary bg-opacity-70 dark:bg-surface-primary-dark dark:bg-opacity-70">
          <ProgressSpinner strokeWidth="4" class="text-primary-500 dark:text-primary-400" />
        </div>
        
        <!-- Global Map Component -->
        <GlobalMap
          ref="globalMapRef"
          :locations="filteredLocations"
          :edges="edges"
          @location-click="handleLocationClick"
        />
      </div>
    </div>
    
    <!-- Location List -->
    <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
      <DataTable
        title="Locations"
        :items="filteredLocations"
        :columns="columns"
        :loading="loading"
        :paginated="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        :searchable="true"
        :searchFields="['name', 'code', 'expand.edge_id.name', 'type']"
        empty-message="No locations found. Try adjusting your filters."
        @row-click="navigateToDetail"
      >
        <!-- Name Column Custom Template -->
        <template #name-body="{ data }">
          <div class="flex items-center">
            <i 
              class="pi pi-map-marker mr-2 text-lg"
              :class="getIconColorClass(data.type)"
            ></i>
            <div>
              <div class="font-medium text-sm text-content-primary dark:text-content-primary-dark">{{ data.name }}</div>
              <div class="text-xs text-content-secondary dark:text-content-secondary-dark">{{ data.code }}</div>
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
            <div class="text-sm text-content-primary dark:text-content-primary-dark">{{ data.expand.edge_id.name }}</div>
            <div class="text-xs text-content-secondary dark:text-content-secondary-dark">{{ data.expand.edge_id.code }}</div>
          </div>
          <div v-else class="text-sm text-content-tertiary dark:text-content-tertiary-dark">No edge</div>
        </template>
        
        <!-- Path Column Custom Template -->
        <template #path-body="{ data }">
          <div class="text-sm text-content-primary dark:text-content-primary-dark">{{ formatPath(data.path) }}</div>
        </template>
        
        <!-- Coordinates Column Custom Template -->
        <template #coordinates-body="{ data }">
          <div v-if="hasCoordinates(data)" class="text-sm text-content-primary dark:text-content-primary-dark">
            {{ formatCoordinates(data) }}
          </div>
          <div v-else class="text-sm text-content-tertiary dark:text-content-tertiary-dark">No coordinates</div>
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
    </div>
    
    <!-- Location Detail Dialog -->
    <Dialog
      v-model:visible="locationDialog.visible"
      :header="locationDialog.title"
      :style="{ width: '90%', maxWidth: '600px' }"
      :modal="true"
      :closable="true"
      :closeOnEscape="true"
      class="theme-transition"
    >
      <div v-if="locationDialog.location" class="theme-transition">
        <div class="mb-4">
          <span 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
            :class="getTypeClass(locationDialog.location.type)"
          >
            {{ getTypeName(locationDialog.location.type) }}
          </span>
          <p class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">{{ locationDialog.location.code }}</p>
          <p class="text-sm mb-3 text-content-secondary dark:text-content-secondary-dark">{{ formatPath(locationDialog.location.path) }}</p>
          
          <div v-if="locationDialog.location.description" class="text-sm mt-2 text-content-primary dark:text-content-primary-dark">
            {{ locationDialog.location.description }}
          </div>
          
          <div v-if="getEdgeName(locationDialog.location)" class="mt-4 p-3 rounded bg-surface-secondary dark:bg-surface-secondary-dark">
            <p class="text-sm font-medium text-content-primary dark:text-content-primary-dark">Edge</p>
            <p class="text-sm text-content-secondary dark:text-content-secondary-dark">{{ getEdgeName(locationDialog.location) }}</p>
          </div>
        </div>
        
        <template v-if="hasCoordinates(locationDialog.location)">
          <h3 class="font-medium mb-2 mt-4 text-content-primary dark:text-content-primary-dark">Coordinates</h3>
          <p class="text-sm text-content-secondary dark:text-content-secondary-dark">{{ formatCoordinates(locationDialog.location) }}</p>
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
import { FilterMatchMode } from 'primevue/api'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

// Import composables and store
import { useLocation } from '../composables/useLocation'
import { useTypesStore } from '../stores/types'

// Import components
import GlobalMap from '../components/map/GlobalMap.vue'
import DataTable from '../components/common/DataTable.vue'

// Initialize composables and store
const { 
  locations, 
  loading, 
  error, 
  locationTypes,
  formatPath,
  getTypeName,
  getTypeClass,
  hasMetadata,
  fetchLocations,
  fetchRootLocations,
  navigateToLocationDetail,
  navigateToLocationEdit
} = useLocation()

// Get types store for types management
const typesStore = useTypesStore()

// Load location types
typesStore.loadLocationTypes()

const globalMapRef = ref(null)

// Data
const edges = ref([])

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
    ...typesStore.locationTypes.map(type => ({
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
  // Load data using the composable methods
  await Promise.all([
    fetchLocations({ expand: 'edge_id', sort: 'name', limit: 100 }),
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

// Fetch edge data - still needs edgeService since we haven't created a composable for it yet
const fetchEdges = async () => {
  try {
    // Import the edgeService directly for this specific action
    const { edgeService } = await import('../services')
    
    const response = await edgeService.getList({
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

// Get theme-aware icon color
const getIconColorClass = (type) => {
  // Using the theming system
  const typeColorMap = {
    'entrance': 'text-blue-600 dark:text-blue-400',
    'work-area': 'text-green-600 dark:text-green-400',
    'meeting-room': 'text-purple-600 dark:text-purple-400',
    'break-area': 'text-amber-600 dark:text-amber-400',
    'reception': 'text-indigo-600 dark:text-indigo-400',
    'security': 'text-red-600 dark:text-red-400',
    'server-room': 'text-cyan-600 dark:text-cyan-400',
    'utility-room': 'text-teal-600 dark:text-teal-400',
    'storage': 'text-gray-600 dark:text-gray-400',
    'entrance-hall': 'text-blue-600 dark:text-blue-400'
  }
  
  return typeColorMap[type] || 'text-gray-600 dark:text-gray-400'
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
  navigateToLocationDetail(id)
}

const navigateToEdit = (id) => {
  locationDialog.value.visible = false
  navigateToLocationEdit(id)
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
