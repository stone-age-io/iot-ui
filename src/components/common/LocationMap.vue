<!-- src/components/common/LocationMap.vue -->
<template>
  <div ref="mapContainer" class="map-container" :style="{ height: height }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  center: {
    type: Object,
    required: true, // {lat: number, lng: number}
  },
  zoom: {
    type: Number,
    default: 15
  },
  markers: {
    type: Array,
    default: () => []
    // Expected format: [{id, lat, lng, type, name, popup}]
  },
  height: {
    type: String,
    default: '400px'
  }
});

const mapContainer = ref(null);
const map = ref(null);
const markersLayer = ref(null);
const openedPopup = ref(null);

// Initialize the map
onMounted(() => {
  if (!mapContainer.value) return;
  
  // Create map
  map.value = L.map(mapContainer.value).setView(
    [props.center.lat, props.center.lng], 
    props.zoom
  );
  
  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map.value);
  
  // Add markers layer
  markersLayer.value = L.layerGroup().addTo(map.value);
  
  // Add initial markers
  updateMarkers();
});

// Clean up on unmount
onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
});

// Update markers when props change
watch(() => props.markers, updateMarkers, { deep: true });
watch(() => props.center, updateCenter);
watch(() => props.zoom, updateZoom);

// Function to update map center
function updateCenter() {
  if (map.value) {
    map.value.setView([props.center.lat, props.center.lng], map.value.getZoom());
  }
}

// Function to update zoom level
function updateZoom() {
  if (map.value) {
    map.value.setZoom(props.zoom);
  }
}

// Function to update markers
function updateMarkers() {
  if (!markersLayer.value) return;
  
  // Clear existing markers
  markersLayer.value.clearLayers();
  
  // Add markers
  props.markers.forEach(marker => {
    // Create custom icon based on thing type
    const icon = getMarkerIcon(marker.type);
    
    // Create marker
    const markerObj = L.marker([marker.lat, marker.lng], { icon }).addTo(markersLayer.value);
    
    // Add popup if provided
    if (marker.popup) {
      markerObj.bindPopup(marker.popup);
    } else {
      markerObj.bindPopup(`<strong>${marker.name}</strong><br>${marker.type}`);
    }
  });
}

// Helper function to get marker icon based on thing type
function getMarkerIcon(type) {
  // Define icon colors based on thing type
  const iconColor = {
    'reader': 'blue',
    'controller': 'purple',
    'lock': 'orange',
    'camera': 'red',
    'temperature-sensor': 'green',
    'humidity-sensor': 'teal',
    'motion-sensor': 'indigo',
    'occupancy-sensor': 'yellow',
    'default': 'gray'
  }[type] || 'gray';
  
  // Create icon using Leaflet's divIcon for custom styling
  return L.divIcon({
    className: `custom-marker-${iconColor}`,
    html: `<div class="marker-pin bg-${iconColor}-500"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
}
</script>

<style>
.map-container {
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Custom marker styles */
.marker-pin {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #4a5568;
  box-shadow: 0 0 0 2px white, 0 0 0 3px rgba(0,0,0,0.2);
}

/* Define colors for different marker types */
.marker-pin.bg-blue-500 { background-color: #3b82f6; }
.marker-pin.bg-purple-500 { background-color: #8b5cf6; }
.marker-pin.bg-orange-500 { background-color: #f97316; }
.marker-pin.bg-red-500 { background-color: #ef4444; }
.marker-pin.bg-green-500 { background-color: #22c55e; }
.marker-pin.bg-teal-500 { background-color: #14b8a6; }
.marker-pin.bg-indigo-500 { background-color: #6366f1; }
.marker-pin.bg-yellow-500 { background-color: #eab308; }
.marker-pin.bg-gray-500 { background-color: #6b7280; }
</style>
