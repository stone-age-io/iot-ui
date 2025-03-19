<!-- src/components/map/GlobalMap.vue -->
<template>
  <div :id="mapId" class="global-map" style="height: 100%"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/leaflet.markercluster.js'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

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
const map = ref(null)
const markersLayer = ref(null)
const locationMarkers = ref({}) // Store markers by location ID

// Initialize map
onMounted(() => {
  initMap()
})

// Clean up on unmount
onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
  }
})

// Re-render markers when locations change
watch(() => props.locations, () => {
  renderMarkers()
}, { deep: true })

// Initialize the map
const initMap = () => {
  // Fix Leaflet icon paths
  fixLeafletIconPaths()
  
  // Initialize map
  map.value = L.map(mapId).setView([39.8283, -98.5795], 4) // Center on US
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map.value)
  
  // Initialize marker cluster group
  markersLayer.value = L.markerClusterGroup({
    disableClusteringAtZoom: 19,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 40
  }).addTo(map.value)
  
  // Render initial markers
  renderMarkers()
}

// Render location markers
const renderMarkers = () => {
  if (!map.value || !markersLayer.value) return
  
  // Clear existing markers
  markersLayer.value.clearLayers()
  locationMarkers.value = {}
  
  // Group locations by edge
  const edgeLocations = {}
  
  props.locations.forEach(location => {
    if (!location.edge_id) return
    
    if (!edgeLocations[location.edge_id]) {
      edgeLocations[location.edge_id] = []
    }
    
    edgeLocations[location.edge_id].push(location)
  })
  
  // Track valid marker coordinates for bounds calculation
  const validMarkers = []
  
  // Add markers for each location
  props.locations.forEach(location => {
    // Skip if no valid coordinates
    if (!hasValidCoordinates(location)) return
    
    // Get coordinates
    const lat = location.metadata.coordinates.lat
    const lng = location.metadata.coordinates.lng || location.metadata.coordinates.long
    
    // Create marker
    const marker = L.marker([lat, lng], {
      title: location.name
    })
    
    // Build popup content
    const edge = props.edges.find(e => e.id === location.edge_id)
    const edgeName = edge ? edge.name : 'Unknown Edge'
    
    marker.bindPopup(`
      <div class="location-popup">
        <h3>${location.name}</h3>
        <p class="code">${location.code}</p>
        <p class="edge"><strong>Edge:</strong> ${edgeName}</p>
        <div class="badge badge-${location.type}">${getLocationTypeName(location.type)}</div>
        <button class="view-button" data-location-id="${location.id}">View Details</button>
      </div>
    `)
    
    // Handle popup open
    marker.on('popupopen', (e) => {
      // Find the view button in the popup
      const button = document.querySelector(`.view-button[data-location-id="${location.id}"]`)
      if (button) {
        // Add click event
        button.addEventListener('click', () => {
          emit('location-click', location)
        })
      }
    })
    
    // Add to cluster layer
    markersLayer.value.addLayer(marker)
    
    // Store marker reference
    locationMarkers.value[location.id] = marker
    
    // Track for bounds calculation
    validMarkers.push([lat, lng])
  })
  
  // Fit map to markers if we have any
  if (validMarkers.length > 0) {
    map.value.fitBounds(validMarkers)
  }
}

// Check if location has valid coordinates
const hasValidCoordinates = (location) => {
  return location.metadata && 
         location.metadata.coordinates && 
         location.metadata.coordinates.lat && 
         (location.metadata.coordinates.lng || location.metadata.coordinates.long)
}

// Fix Leaflet icon paths (common issue in bundled apps)
const fixLeafletIconPaths = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
  });
}

// Get location type name from code
const getLocationTypeName = (typeCode) => {
  const types = {
    'entrance': 'Entrance',
    'work-area': 'Work Area',
    'meeting-room': 'Meeting Room',
    'break-area': 'Break Area',
    'reception': 'Reception',
    'security': 'Security',
    'server-room': 'Server Room',
    'utility-room': 'Utility Room',
    'storage': 'Storage',
    'entrance-hall': 'Entrance Hall'
  }
  
  return types[typeCode] || typeCode
}
</script>

<style scoped>
.global-map {
  border-radius: 6px;
}

:deep(.location-popup) {
  min-width: 200px;
  padding: 6px;
}

:deep(.location-popup h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

:deep(.location-popup .code) {
  font-family: monospace;
  color: #666;
  margin: 0 0 8px 0;
}

:deep(.location-popup .edge) {
  margin: 0 0 8px 0;
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

:deep(.leaflet-cluster-anim .leaflet-marker-icon, .leaflet-cluster-anim .leaflet-marker-shadow) {
  transition: transform 0.3s ease-out, opacity 0.3s ease-in;
}
</style>
