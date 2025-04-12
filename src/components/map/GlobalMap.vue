<!-- src/components/map/GlobalMap.vue (Fixed marker visibility) -->
<template>
  <div :id="mapId" class="global-map" style="height: 100%; width: 100%"></div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useGlobalMap } from '../../composables/useGlobalMap'
import { useTypesStore } from '../../stores/types'

// Initialize composables and store
const mapComposable = useGlobalMap()
const typesStore = useTypesStore()

// Ensure location types are loaded
typesStore.loadLocationTypes()

const props = defineProps({
  locations: {
    type: Array,
    required: true
  },
  edges: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['location-click'])

// Generate unique map ID
const mapId = `global-map-${Math.random().toString(36).substring(2, 9)}`

// Track when markers should be rendered
const shouldRenderMarkers = ref(false)

// Initialize map on mount
onMounted(() => {
  nextTick(() => {
    // Initialize map with the uniquely generated ID
    mapComposable.initMap(mapId, {
      center: [39.8283, -98.5795], // Default center on US
      zoom: 5,
      zoomControl: true,
      zoomAnimationThreshold: 4,
      zoomSnap: 0.5,
      wheelPxPerZoomLevel: 120,
      maxBoundsViscosity: 0.8
    })
    
    // Setup custom event for location clicks
    document.addEventListener('location-click', handleLocationClickEvent)
    
    // Render markers after initialization
    shouldRenderMarkers.value = true
  })
})

// Clean up event listener on component unmount
onBeforeUnmount(() => {
  document.removeEventListener('location-click', handleLocationClickEvent)
})

// Event handler for location clicks from popup
const handleLocationClickEvent = (event) => {
  if (event.detail && event.detail.location) {
    emit('location-click', event.detail.location)
  }
}

// Watch for changes in locations and edges to update map
watch(() => [props.locations, props.edges], () => {
  if (shouldRenderMarkers.value && mapComposable.mapInitialized.value) {
    renderMarkers()
  }
}, { deep: true })

// Watch for map initialization to render markers
watch(() => mapComposable.mapInitialized.value, (initialized) => {
  if (initialized && shouldRenderMarkers.value) {
    renderMarkers()
  }
})

// Render location markers using the composable
const renderMarkers = () => {
  // Get location type names from Types store for each marker
  const renderLocations = props.locations.map(location => {
    // Create a copy of the location to avoid modifying props
    const locationCopy = { ...location }
    
    // Add a function that will be used by the composable to get the type name
    locationCopy._getTypeName = () => {
      return typesStore.getTypeName(location.type, 'locationTypes')
    }
    
    return locationCopy
  })
  
  // Render markers using the composable
  mapComposable.renderMarkers(renderLocations, props.edges)
}

// Expose methods for parent components to use
defineExpose({
  centerMapToAllLocations: mapComposable.centerToAllLocations,
  centerMapToLocation: mapComposable.centerToLocation,
  findMarkerById: mapComposable.findMarkerById
})
</script>

<style scoped>
.global-map {
  border-radius: 6px;
  position: relative;
  z-index: 1; /* Lower z-index to prevent overlay issues with sidebar */
}

/* Custom marker styling - IMPORTANT for marker visibility */
:deep(.custom-location-marker) {
  background: none;
  border: none;
  position: relative;
}

:deep(.location-marker-dot) {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

/* Improve marker cluster styling */
:deep(.marker-cluster) {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  font-weight: bold;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

:deep(.marker-cluster div) {
  width: 34px;
  height: 34px;
  margin: 3px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

:deep(.marker-cluster-small div) {
  background-color: rgba(59, 130, 246, 0.7);
  color: white;
}

:deep(.marker-cluster-medium div) {
  background-color: rgba(139, 92, 246, 0.7);
  color: white;
}

:deep(.marker-cluster-large div) {
  background-color: rgba(239, 68, 68, 0.7);
  color: white;
}

:deep(.marker-cluster span) {
  font-weight: 600;
  font-size: 12px;
}

/* Popup styling */
:deep(.location-popup) {
  padding: 8px;
}

:deep(.location-popup h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

:deep(.location-popup .code) {
  font-family: monospace;
  color: #666;
  margin: 0 0 8px 0;
  font-size: 0.85rem;
}

:deep(.location-popup .edge) {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
}

:deep(.location-popup .badge) {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 10px;
}

:deep(.badge-entrance) { background-color: #dbeafe; color: #1e40af; }
:deep(.badge-work-area) { background-color: #dcfce7; color: #166534; }
:deep(.badge-meeting-room) { background-color: #ede9fe; color: #5b21b6; }
:deep(.badge-break-area) { background-color: #ffedd5; color: #9a3412; }
:deep(.badge-reception) { background-color: #e0e7ff; color: #3730a3; }
:deep(.badge-security) { background-color: #fee2e2; color: #b91c1c; }
:deep(.badge-server-room) { background-color: #cffafe; color: #0e7490; }
:deep(.badge-utility-room) { background-color: #ccfbf1; color: #0f766e; }
:deep(.badge-storage) { background-color: #f3f4f6; color: #374151; }
:deep(.badge-entrance-hall) { background-color: #dbeafe; color: #1e40af; }

:deep(.view-button) {
  display: block;
  width: 100%;
  padding: 6px 10px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  text-align: center;
}

:deep(.view-button:hover) {
  background-color: #2563eb;
}

:deep(.leaflet-control a) {
  width: 30px;
  height: 30px;
  line-height: 30px;
  font-size: 16px;
  display: flex !important;
  align-items: center;
  justify-content: center;
}
</style>
