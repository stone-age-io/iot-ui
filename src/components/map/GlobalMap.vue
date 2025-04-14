<!-- src/components/map/GlobalMap.vue -->
<template>
  <div :id="mapId" class="global-map theme-transition" style="height: 100%; width: 100%"></div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useGlobalMap } from '../../composables/useGlobalMap'
import { useTypesStore } from '../../stores/types'
import { useTheme } from '../../composables/useTheme' // Import theme composable

// Initialize composables and store
const mapComposable = useGlobalMap()
const typesStore = useTypesStore()
const { isDarkMode } = useTheme() // Get dark mode state from theme composable

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
const mapInitialized = ref(false)

// Initialize map on mount
onMounted(() => {
  nextTick(() => {
    // Initialize map with the uniquely generated ID and pass the theme state
    mapComposable.initMap(mapId, {
      center: [39.8283, -98.5795], // Default center on US
      zoom: 5,
      zoomControl: true,
      zoomAnimationThreshold: 4,
      zoomSnap: 0.5,
      wheelPxPerZoomLevel: 120,
      maxBoundsViscosity: 0.8,
      darkMode: isDarkMode.value // Pass the current theme state
    })
    
    // Setup custom event for location clicks
    document.addEventListener('location-click', handleLocationClickEvent)
    
    // Mark as initialized
    mapInitialized.value = true
    
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

// Watch for theme changes and update map tiles
watch(() => isDarkMode.value, (newIsDark) => {
  if (mapInitialized.value && mapComposable.map.value) {
    // Update map tile layer based on theme
    mapComposable.updateMapTiles(newIsDark)
    
    // Re-render markers to update their styles
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
  
  // Render markers using the composable, passing current theme
  mapComposable.renderMarkers(renderLocations, props.edges, isDarkMode.value)
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

/* Theme transition for map components */
.theme-transition,
.theme-transition * {
  transition-property: background-color, border-color, color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Fix for dark mode map attribution text */
:deep(.dark-mode-map .leaflet-control-attribution) {
  background-color: rgba(31, 41, 55, 0.7) !important;
  color: #d1d5db !important;
}

/* Fix for dark mode map controls */
:deep(.dark-mode-map .leaflet-control a) {
  background-color: #374151 !important;
  color: #d1d5db !important;
  border-color: #4b5563 !important;
}

:deep(.dark-mode-map .leaflet-control a:hover) {
  background-color: #4b5563 !important;
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

/* Dark mode marker styles */
:deep(.dark-mode-map .location-marker-dot) {
  border-color: #1f2937;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

/* Improve marker cluster styling with dark mode support */
:deep(.marker-cluster) {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  font-weight: bold;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

:deep(.dark-mode-map .marker-cluster) {
  background-color: rgba(31, 41, 55, 0.8);
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

/* Dark mode popup styles */
:deep(.dark-mode-map .leaflet-popup-content-wrapper) {
  background-color: #1f2937 !important;
  color: #e5e7eb !important;
}

:deep(.dark-mode-map .leaflet-popup-tip) {
  background-color: #1f2937 !important;
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

:deep(.dark-mode-map .location-popup h3) {
  color: #f3f4f6;
}

:deep(.location-popup .code) {
  font-family: monospace;
  color: #666;
  margin: 0 0 8px 0;
  font-size: 0.85rem;
}

:deep(.dark-mode-map .location-popup .code) {
  color: #9ca3af;
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

/* Dark mode badge variants */
:deep(.dark-mode-map .badge-entrance) { background-color: rgba(30, 64, 175, 0.3); color: #93c5fd; }
:deep(.dark-mode-map .badge-work-area) { background-color: rgba(22, 101, 52, 0.3); color: #86efac; }
:deep(.dark-mode-map .badge-meeting-room) { background-color: rgba(91, 33, 182, 0.3); color: #d8b4fe; }
:deep(.dark-mode-map .badge-break-area) { background-color: rgba(154, 52, 18, 0.3); color: #fcd34d; }
:deep(.dark-mode-map .badge-reception) { background-color: rgba(55, 48, 163, 0.3); color: #a5b4fc; }
:deep(.dark-mode-map .badge-security) { background-color: rgba(185, 28, 28, 0.3); color: #fca5a5; }
:deep(.dark-mode-map .badge-server-room) { background-color: rgba(14, 116, 144, 0.3); color: #67e8f9; }
:deep(.dark-mode-map .badge-utility-room) { background-color: rgba(15, 118, 110, 0.3); color: #5eead4; }
:deep(.dark-mode-map .badge-storage) { background-color: rgba(55, 65, 81, 0.3); color: #d1d5db; }

/* Light mode badge variants */
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

:deep(.dark-mode-map .view-button) {
  background-color: #60a5fa;
  color: #1f2937;
}

:deep(.dark-mode-map .view-button:hover) {
  background-color: #93c5fd;
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
