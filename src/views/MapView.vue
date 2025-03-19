<!-- src/views/MapView.vue -->
<template>
  <div>
    <PageHeader 
      title="Locations Map" 
      subtitle="Global view of all edge installations and locations"
    />
    
    <div class="card">
      <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-xl font-semibold">Map Filters</h2>
        
        <div class="flex flex-col sm:flex-row gap-2">
          <!-- Edge Filter -->
          <Dropdown
            v-model="selectedEdge"
            :options="edges"
            optionLabel="name"
            optionValue="id"
            placeholder="All Edges"
            class="w-full sm:w-auto"
            @change="filterLocations"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value">
                {{ getEdgeName(slotProps.value) }}
              </div>
              <div v-else>All Edges</div>
            </template>
          </Dropdown>
          
          <!-- Location Type Filter -->
          <Dropdown
            v-model="selectedLocationType"
            :options="locationTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="All Types"
            class="w-full sm:w-auto"
            @change="filterLocations"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value">
                {{ getLocationTypeName(slotProps.value) }}
              </div>
              <div v-else>All Types</div>
            </template>
          </Dropdown>
          
          <!-- Reset Filters Button -->
          <Button
            label="Reset Filters"
            icon="pi pi-filter-slash"
            class="p-button-outlined"
            @click="resetFilters"
          />
        </div>
      </div>
      
      <!-- Loading Spinner -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <ProgressSpinner strokeWidth="4" />
      </div>
      
      <!-- Global Map -->
      <div v-else class="global-map-container" style="height: 600px; position: relative;">
        <GlobalMap
          :locations="filteredLocations"
          :edges="edges"
          @location-click="navigateToLocation"
        />
      </div>
      
      <!-- Location Listing -->
      <div class="mt-6">
        <h2 class="text-xl font-semibold mb-4">Locations ({{ filteredLocations.length }})</h2>
        <DataTable
          :items="filteredLocations"
          :columns="columns"
          :searchable="true"
          :searchFields="['code', 'name', 'path', 'expand.edge_id.code']"
          empty-message="No locations found"
          @row-click="navigateToLocation"
          :paginated="true"
          :rows="5"
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
          
          <!-- Actions column -->
          <template #actions="{ data }">
            <div class="flex gap-1 justify-center">
              <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToLocation(data)"
                tooltip="View"
                tooltipOptions="{ position: 'top' }"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { locationService, locationTypes } from '../services/location'
import { edgeService } from '../services/edge'
import PageHeader from '../components/common/PageHeader.vue'
import GlobalMap from '../components/map/GlobalMap.vue'
import DataTable from '../components/common/DataTable.vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()

// Data
const locations = ref([])
const edges = ref([])
const loading = ref(true)
const selectedEdge = ref(null)
const selectedLocationType = ref(null)

// Table columns definition
const columns = [
  { field: 'code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'edge_id', header: 'Edge', sortable: true },
  { field: 'actions', header: 'Actions', sortable: false }
]

// Filtered locations based on selected filters
const filteredLocations = computed(() => {
  let result = [...locations.value]
  
  // Filter by edge
  if (selectedEdge.value) {
    result = result.filter(location => location.edge_id === selectedEdge.value)
  }
  
  // Filter by location type
  if (selectedLocationType.value) {
    result = result.filter(location => location.type === selectedLocationType.value)
  }
  
  return result.filter(location => hasValidCoordinates(location))
})

// Fetch data on component mount
onMounted(async () => {
  await Promise.all([
    fetchLocations(),
    fetchEdges()
  ])
  loading.value = false
})

// Methods
const fetchLocations = async () => {
  try {
    const response = await locationService.getLocations({ sort: 'name', perPage: 100 })
    locations.value = response.data.items || []
    
    // Parse metadata for each location
    locations.value.forEach(location => {
      if (location.metadata && typeof location.metadata === 'string') {
        try {
          location.metadata = JSON.parse(location.metadata)
        } catch (e) {
          console.warn('Failed to parse metadata for location:', location.code)
          location.metadata = {}
        }
      }
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
  }
}

const fetchEdges = async () => {
  try {
    const response = await edgeService.getEdges({ sort: 'name' })
    edges.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching edges:', error)
  }
}

const hasValidCoordinates = (location) => {
  return location.metadata && 
         location.metadata.coordinates && 
         location.metadata.coordinates.lat && 
         (location.metadata.coordinates.lng || location.metadata.coordinates.long)
}

const navigateToLocation = (location) => {
  router.push({ name: 'location-detail', params: { id: location.id } })
}

const filterLocations = () => {
  // This function is called when filters change
  // The filtering is handled by the computed property
}

const resetFilters = () => {
  selectedEdge.value = null
  selectedLocationType.value = null
}

// Helper functions
const getEdgeName = (edgeId) => {
  const edge = edges.value.find(e => e.id === edgeId)
  return edge ? edge.name : 'Unknown Edge'
}

const getTypeName = (typeCode) => {
  const type = locationTypes.find(t => t.value === typeCode)
  return type ? type.label : typeCode
}

const getLocationTypeName = (typeCode) => {
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
    case 'utility-room': return 'bg-teal-100 text-teal-800'
    case 'storage': return 'bg-gray-100 text-gray-800'
    case 'entrance-hall': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
