<!-- src/components/common/LocationMap.vue -->
<template>
  <div :id="mapId" :style="{ height: height || '400px', width: '100%' }" class="leaflet-map"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);
  
  // Create a layer for markers
  markersLayer.value = L.layerGroup().addTo(map.value);
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
    
    // Add popup if provided
    if (marker.popup) {
      markerObj.bindPopup(marker.popup);
    } else {
      markerObj.bindPopup(`
        <div class="popup-content">
          <strong>${marker.name || 'Unnamed'}</strong>
          ${marker.type ? `<br><span class="badge badge-${marker.type}">${marker.type}</span>` : ''}
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

<style scoped>
.leaflet-map {
  border-radius: 4px;
  overflow: hidden;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 4px;
}

:deep(.leaflet-popup-content) {
  margin: 10px;
}

:deep(.badge) {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  margin-top: 4px;
}
</style>
