<!-- src/components/map/GlobalMap.vue - Improved version -->
<template>
  <div :id="mapId" class="global-map" style="height: 100%; width: 100%"></div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
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
const mapInitialized = ref(false)
const savedMapState = ref(null)

// Initialize map
onMounted(() => {
  nextTick(() => {
    initMap();
  });
})

// Clean up on unmount
onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
  
  window.removeEventListener('resize', handleResize);
})

// Re-render markers when locations or edges change
watch(() => props.locations, () => {
  if (mapInitialized.value) {
    renderMarkers();
  }
}, { deep: true })

watch(() => props.edges, () => {
  if (mapInitialized.value) {
    renderMarkers();
  }
}, { deep: true })

// Handle resize events
const handleResize = () => {
  if (!map.value) return;
  
  // If a zoom animation is in progress, defer the resize
  if (map.value._isZooming) {
    setTimeout(() => handleResize(), 300);
    return;
  }
  
  // Force a map redraw when container resizes
  // Use try-catch to handle potential errors during invalidation
  try {
    // Stop any current animations before invalidating
    if (map.value._pathZoom) {
      map.value._pathZoom = null;
    }
    
    map.value.invalidateSize({ animate: false, pan: false, debounceMoveend: true });
    
    if (savedMapState.value && savedMapState.value.bounds && savedMapState.value.bounds.isValid()) {
      // Re-fit to bounds after resize, but avoid animation
      map.value.fitBounds(savedMapState.value.bounds, {
        padding: [50, 50],
        maxZoom: 8,
        animate: false
      });
    }
  } catch (err) {
    console.error('Error handling resize:', err);
  }
}

// Initialize the map
const initMap = () => {
  // Fix Leaflet icon paths
  fixLeafletIconPaths();
  
  // Initialize map with improved options
  map.value = L.map(mapId, {
    center: [39.8283, -98.5795], // Default center on US
    zoom: 5, // Higher default zoom level
    zoomControl: true,
    zoomAnimationThreshold: 4, // Prevent animation for big zoom changes
    zoomSnap: 0.5,
    wheelPxPerZoomLevel: 120, // Improve mouse wheel zoom sensitivity
    maxBoundsViscosity: 0.8
  });
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    minZoom: 2,
    noWrap: true // Prevent wrapping around the globe
  }).addTo(map.value);
  
  // Initialize marker cluster group with improved settings
  markersLayer.value = L.markerClusterGroup({
    disableClusteringAtZoom: 19,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 50,
    animate: false, // Disable animation to prevent marker positioning issues
    animateAddingMarkers: false, // Disable animation when adding markers
    iconCreateFunction: (cluster) => {
      // Custom cluster icon with more visible styling
      const count = cluster.getChildCount();
      let size, className;
      
      if (count < 10) {
        size = 'small';
        className = 'marker-cluster-small';
      } else if (count < 50) {
        size = 'medium';
        className = 'marker-cluster-medium';
      } else {
        size = 'large';
        className = 'marker-cluster-large';
      }
      
      return new L.DivIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster ${className}`,
        iconSize: new L.Point(40, 40)
      });
    }
  }).addTo(map.value);
  
  // Add a home button to reset the view
  addHomeControl();
  
  // Render initial markers
  renderMarkers();
  
  // Add window resize listener
  window.addEventListener('resize', handleResize);
  
  // Handle zoom events to prevent issues with marker positioning
  map.value.on('zoomstart', () => {
    // Set a flag to indicate zoom is in progress
    map.value._isZooming = true;
  });
  
  map.value.on('zoomend', () => {
    // Clear the zooming flag
    map.value._isZooming = false;
  });
  
  // Mark map as initialized
  mapInitialized.value = true;
}

// Add home button for resetting view
const addHomeControl = () => {
  const homeControl = L.control({ position: 'topleft' });
  homeControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
    const button = L.DomUtil.create('a', '', div);
    button.href = '#';
    button.title = 'Show All Locations';
    button.innerHTML = '<i class="pi pi-home"></i>';
    button.role = 'button';
    button.style.fontWeight = 'bold';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.on(button, 'click', (e) => {
      L.DomEvent.preventDefault(e);
      centerMapToAllLocations();
    });
    
    return div;
  };
  homeControl.addTo(map.value);
}

// Render location markers
const renderMarkers = () => {
  if (!map.value || !markersLayer.value) return;
  
  // If a zoom animation is in progress, defer marker rendering
  if (map.value._isZooming) {
    setTimeout(() => renderMarkers(), 300);
    return;
  }
  
  // Clear existing markers with animation disabled
  markersLayer.value.clearLayers();
  locationMarkers.value = {};
  
  // Track valid marker coordinates for bounds calculation
  const validMarkerPositions = [];
  
  // Add markers for each location
  props.locations.forEach(location => {
    // Skip if no valid coordinates
    if (!hasValidCoordinates(location)) return;
    
    // Get coordinates
    const lat = location.metadata.coordinates.lat;
    const lng = location.metadata.coordinates.lng || location.metadata.coordinates.long;
    
    // Track position for bounds calculation
    validMarkerPositions.push([lat, lng]);
    
    // Find the edge for this location
    const edge = props.edges.find(e => e.id === location.edge_id);
    
    // Create a custom icon based on location type
    const icon = createCustomIcon(location.type);
    
    // Create marker with custom icon
    const marker = L.marker([lat, lng], {
      title: location.name,
      icon: icon,
      // Improve marker behavior
      riseOnHover: true,
      riseOffset: 250
    });
    
    // Build popup content
    const edgeName = edge ? edge.name : 'Unknown Edge';
    
    marker.bindPopup(`
      <div class="location-popup">
        <h3>${location.name}</h3>
        <p class="code">${location.code || ''}</p>
        <p class="edge"><strong>Edge:</strong> ${edgeName}</p>
        <div class="badge badge-${location.type}">${getLocationTypeName(location.type)}</div>
        <button class="view-button" data-location-id="${location.id}">View Details</button>
      </div>
    `, {
      maxWidth: 300,
      minWidth: 200
    });
    
    // Handle popup open with improved event handling
    marker.on('popupopen', (e) => {
      setTimeout(() => {
        // Find the view button in the popup
        const button = document.querySelector(`.view-button[data-location-id="${location.id}"]`);
        if (button) {
          // Remove any existing event listeners to prevent duplicates
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
          
          // Add click event
          newButton.addEventListener('click', () => {
            emit('location-click', location);
          });
        }
      }, 10);
    });
    
    // Add to marker layer (no animation)
    markersLayer.value.addLayer(marker);
    
    // Store marker reference
    locationMarkers.value[location.id] = marker;
  });
  
  // Center map to show all markers if there are any
  if (validMarkerPositions.length > 0) {
    try {
      const bounds = L.latLngBounds(validMarkerPositions);
      
      // Only perform bounds fitting if we have a reasonable map area
      if (bounds.isValid()) {
        map.value.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 8, // Limit zoom to a more reasonable level
          animate: false // Disable animation to prevent issues
        });
        
        // Save these bounds for later recentering
        savedMapState.value = {
          bounds: bounds
        };
      } else {
        console.warn('Invalid bounds created from markers');
      }
    } catch (err) {
      console.error('Error fitting bounds:', err);
    }
  }
}

// Center map to show all locations
const centerMapToAllLocations = () => {
  if (!map.value) return;
  
  // If a zoom animation is in progress, defer this operation
  if (map.value._isZooming) {
    setTimeout(() => centerMapToAllLocations(), 300);
    return;
  }
  
  if (!savedMapState.value || !savedMapState.value.bounds) {
    // If we don't have saved bounds, recalculate from current markers
    const validMarkerPositions = props.locations
      .filter(location => hasValidCoordinates(location))
      .map(location => [
        location.metadata.coordinates.lat,
        location.metadata.coordinates.lng || location.metadata.coordinates.long
      ]);
    
    if (validMarkerPositions.length > 0) {
      try {
        const bounds = L.latLngBounds(validMarkerPositions);
        
        if (bounds.isValid()) {
          map.value.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 8, // More reasonable max zoom
            animate: false // Disable animation to prevent issues
          });
          
          // Save the new bounds
          savedMapState.value = { bounds };
        }
      } catch (err) {
        console.error('Error calculating bounds:', err);
      }
    }
  } else {
    // Use saved bounds
    try {
      map.value.fitBounds(savedMapState.value.bounds, {
        padding: [50, 50],
        maxZoom: 8, // More reasonable max zoom
        animate: false // Disable animation to prevent issues
      });
    } catch (err) {
      console.error('Error fitting to saved bounds:', err);
    }
  }
}

// Create custom icon based on location type
const createCustomIcon = (locationType) => {
  // Pick color based on location type
  const colorMap = {
    'entrance': '#3b82f6',      // blue
    'work-area': '#10b981',     // green
    'meeting-room': '#8b5cf6',  // purple
    'break-area': '#f59e0b',    // amber
    'reception': '#6366f1',     // indigo
    'security': '#ef4444',      // red
    'server-room': '#06b6d4',   // cyan
    'utility-room': '#0d9488',  // teal
    'storage': '#6b7280',       // gray
    'entrance-hall': '#3b82f6'  // blue
  };
  
  const color = colorMap[locationType] || '#6b7280';
  
  return L.divIcon({
    className: 'custom-location-marker',
    html: `<div class="location-marker-dot" style="background-color: ${color}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10]
  });
}

// Check if location has valid coordinates
const hasValidCoordinates = (location) => {
  return location.metadata && 
         location.metadata.coordinates && 
         location.metadata.coordinates.lat && 
         (location.metadata.coordinates.lng || location.metadata.coordinates.long);
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
  
  return types[typeCode] || typeCode;
}
</script>

<style scoped>
.global-map {
  border-radius: 6px;
  position: relative;
  z-index: 1; /* Lower z-index to prevent overlay issues with sidebar */
}

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
