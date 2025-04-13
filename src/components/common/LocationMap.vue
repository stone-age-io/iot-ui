<!-- src/components/common/LocationMap.vue -->
<template>
  <div 
    :id="mapId" 
    :style="{ height: height || '400px', width: '100%' }" 
    class="leaflet-map rounded-lg overflow-hidden border border-theme-border dark:border-gray-700"
  ></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useThemeStore } from '../../stores/theme';

// Props definition
const props = defineProps({
  center: {
    type: Object,
    default: () => ({ lat: 0, lng: 0 })
  },
  zoom: {
    type: Number,
    default: 13
  },
  markers: {
    type: Array,
    default: () => []
  },
  height: {
    type: String,
    default: '400px'
  }
});

// Generate unique map ID
const mapId = `map-${Math.random().toString(36).substring(2, 9)}`;
const map = ref(null);
const markersLayer = ref(null);
const themeStore = useThemeStore();

// Detect if dark mode is active - use the theme store for this
const isDarkMode = computed(() => {
  return themeStore.theme === 'dark' || 
    (themeStore.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
});

// Initialize map on mount
onMounted(() => {
  initMap();
  
  // Add markers
  renderMarkers();
});

// Cleanup on unmount
onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
  }
});

// Watch for prop changes
watch(() => props.center, (newCenter) => {
  if (map.value && newCenter && newCenter.lat && newCenter.lng) {
    map.value.setView([newCenter.lat, newCenter.lng], props.zoom);
  }
}, { deep: true });

watch(() => props.markers, () => {
  renderMarkers();
}, { deep: true });

// Watch for theme changes
watch(() => isDarkMode.value, (darkMode) => {
  if (map.value) {
    updateMapTiles(darkMode);
  }
});

// Create the map
const initMap = () => {
  // Fix icon paths (common Leaflet issue in bundled apps)
  fixLeafletIconPaths();
  
  // Make sure we have valid coordinates
  const centerPoint = [
    props.center.lat || 0, 
    props.center.lng || props.center.long || 0
  ];
  
  // Initialize the map
  map.value = L.map(mapId).setView(centerPoint, props.zoom);
  
  // Add appropriate tiles based on theme
  updateMapTiles(isDarkMode.value);
  
  // Create a layer for markers
  markersLayer.value = L.layerGroup().addTo(map.value);
};

// Update map tiles based on theme
const updateMapTiles = (darkMode) => {
  if (!map.value) return;
  
  // Remove any existing tile layers
  map.value.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      map.value.removeLayer(layer);
    }
  });
  
  // Add appropriate tiles based on theme
  if (darkMode) {
    // Dark theme tiles - using CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map.value);
  } else {
    // Light theme tiles - using OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.value);
  }
};

// Render markers on the map
const renderMarkers = () => {
  if (!map.value || !markersLayer.value) return;
  
  // Clear existing markers
  markersLayer.value.clearLayers();
  
  // Add new markers
  props.markers.forEach(marker => {
    // Skip invalid markers
    if (!marker.lat || (!marker.lng && !marker.long)) return;
    
    // Create marker with appropriate icon
    const markerObj = L.marker([
      marker.lat, 
      marker.lng || marker.long
    ]);
    
    // Style marker popups based on theme
    const popupClassName = isDarkMode.value ? 'popup-dark' : 'popup-light';
    
    // Add popup if provided
    if (marker.popup) {
      markerObj.bindPopup(`<div class="popup-content ${popupClassName}">${marker.popup}</div>`);
    } else {
      // Create a formatted popup with type badge if available
      let badgeHtml = '';
      if (marker.type) {
        const badgeClass = getBadgeClass(marker.type);
        badgeHtml = `<span class="badge ${badgeClass}">${marker.type}</span>`;
      }
      
      markerObj.bindPopup(`
        <div class="popup-content ${popupClassName}">
          <strong>${marker.name || 'Unnamed'}</strong>
          ${badgeHtml ? `<br>${badgeHtml}` : ''}
        </div>
      `);
    }
    
    // Add to layer
    markerObj.addTo(markersLayer.value);
  });
  
  // If we have markers, fit the map to contain all markers
  if (props.markers.length > 0) {
    const validMarkers = props.markers.filter(m => m.lat && (m.lng || m.long));
    if (validMarkers.length > 0) {
      const group = L.featureGroup(Array.from(markersLayer.value.getLayers()));
      map.value.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }
};

// Get badge class based on type
const getBadgeClass = (type) => {
  // Map of types to badge classes
  const classMap = {
    'entrance': 'badge-blue',
    'work-area': 'badge-green',
    'meeting-room': 'badge-purple',
    'break-area': 'badge-amber',
    'reception': 'badge-cyan',
    'security': 'badge-red',
    'server-room': 'badge-indigo',
    'utility-room': 'badge-teal',
    'storage': 'badge-gray'
  };
  
  return classMap[type] || 'badge-gray';
};

// Fix Leaflet icon paths (common issue in bundled apps)
const fixLeafletIconPaths = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
  });
};
</script>

<style>
/* Popup styling with dark mode support */
.leaflet-popup-content-wrapper {
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.popup-dark {
  background-color: #374151;
  color: #f3f4f6;
}

.popup-light {
  background-color: #ffffff;
  color: #1f2937;
}

/* Badge styling consistent with our app */
.badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  margin-top: 4px;
}

.badge-blue { @apply bg-blue-100 text-blue-800; }
.badge-green { @apply bg-green-100 text-green-800; }
.badge-purple { @apply bg-purple-100 text-purple-800; }
.badge-amber { @apply bg-amber-100 text-amber-800; }
.badge-cyan { @apply bg-cyan-100 text-cyan-800; }
.badge-red { @apply bg-red-100 text-red-800; }
.badge-indigo { @apply bg-indigo-100 text-indigo-800; }
.badge-teal { @apply bg-teal-100 text-teal-800; }
.badge-gray { @apply bg-gray-100 text-gray-800; }

/* Dark mode badge versions */
.popup-dark .badge-blue { @apply bg-blue-900/30 text-blue-300; }
.popup-dark .badge-green { @apply bg-green-900/30 text-green-300; }
.popup-dark .badge-purple { @apply bg-purple-900/30 text-purple-300; }
.popup-dark .badge-amber { @apply bg-amber-900/30 text-amber-300; }
.popup-dark .badge-cyan { @apply bg-cyan-900/30 text-cyan-300; }
.popup-dark .badge-red { @apply bg-red-900/30 text-red-300; }
.popup-dark .badge-indigo { @apply bg-indigo-900/30 text-indigo-300; }
.popup-dark .badge-teal { @apply bg-teal-900/30 text-teal-300; }
.popup-dark .badge-gray { @apply bg-gray-700 text-gray-300; }

/* Dark mode overrides for Leaflet controls */
:global(.dark) .leaflet-control-attribution {
  background-color: rgba(31, 41, 55, 0.8) !important;
  color: #d1d5db !important;
}

:global(.dark) .leaflet-control-zoom a {
  background-color: #374151 !important;
  color: #d1d5db !important;
  border-color: #4b5563 !important;
}

:global(.dark) .leaflet-control-zoom a:hover {
  background-color: #4b5563 !important;
}

/* Smooth transitions for theme changes */
.leaflet-control-attribution,
.leaflet-control-zoom a {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
</style>
