<!-- src/components/map/FloorPlanMap.vue -->
<template>
  <div class="floor-plan-map">
    <!-- Loading state -->
    <div v-if="loading" class="loading-overlay">
      <ProgressSpinner strokeWidth="4" />
    </div>
    
    <!-- Floor plan uploader if no plan exists -->
    <div v-else-if="!hasFloorPlan && showUpload" class="upload-container">
      <div class="upload-prompt">
        <i class="pi pi-image text-4xl text-gray-400 mb-3"></i>
        <h3 class="text-lg font-medium mb-2">No Floor Plan Available</h3>
        <p class="text-gray-500 mb-4">Upload a floor plan image to visualize indoor positioning</p>
        <FileUpload
          mode="basic"
          :maxFileSize="5000000"
          accept="image/*"
          :auto="true"
          chooseLabel="Upload Floor Plan"
          @upload="onUpload"
          :customUpload="true"
          @uploader="handleUpload"
        />
      </div>
    </div>
    
    <!-- Map with floor plan -->
    <div v-else-if="hasFloorPlan" class="relative">
      <!-- Map Options -->
      <div class="map-controls absolute top-3 right-3 z-50 bg-white rounded-md shadow-md p-2">
        <!-- Map legend -->
        <Button
          icon="pi pi-list"
          class="p-button-rounded p-button-text p-button-sm"
          @click="showLegend = !showLegend"
          tooltip="Toggle Legend"
          tooltipOptions="{ position: 'left' }"
        />
        
        <!-- Edit mode toggle -->
        <Button
          v-if="editable"
          :icon="editMode ? 'pi pi-check' : 'pi pi-pencil'"
          :class="[
            'p-button-rounded p-button-text p-button-sm ml-1',
            editMode ? 'p-button-success' : ''
          ]"
          @click="toggleEditMode"
          :tooltip="editMode ? 'Save Positions' : 'Edit Positions'"
          tooltipOptions="{ position: 'left' }"
        />
      </div>
      
      <!-- Legend panel -->
      <div 
        v-if="showLegend" 
        class="legend-panel absolute left-3 top-3 z-50 bg-white rounded-md shadow-md p-3"
        style="max-width: 250px; max-height: 80%; overflow-y: auto;"
      >
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-sm font-semibold">Legend</h3>
          <Button
            icon="pi pi-times"
            class="p-button-rounded p-button-text p-button-sm"
            @click="showLegend = false"
          />
        </div>
        
        <div class="space-y-2">
          <div v-for="(typeObj, index) in uniqueThingTypes" :key="index" class="flex items-center">
            <span 
              class="h-3 w-3 rounded-full mr-2"
              :style="{ backgroundColor: getMarkerColor(typeObj.type) }"
            ></span>
            <span class="text-xs">{{ typeObj.label }} ({{ typeObj.count }})</span>
          </div>
        </div>
      </div>
      
      <!-- The Leaflet map with the floor plan -->
      <div id="floorplan-map" :style="{ height: height || '500px' }"></div>
      
      <!-- Edit mode panel -->
      <div v-if="editMode" class="edit-panel p-3 bg-gray-100 border-t border-gray-300">
        <h3 class="text-sm font-medium mb-2">Edit Mode: Place things on the map</h3>
        <p class="text-xs text-gray-500 mb-3">Drag and drop markers to position them on the floor plan. Changes are saved automatically.</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="thing in things" :key="thing.id" class="flex items-center">
            <span 
              class="h-3 w-3 rounded-full mr-2"
              :style="{ backgroundColor: getMarkerColor(thing.type) }"
            ></span>
            <span class="text-sm truncate flex-1">{{ thing.name }}</span>
            <Button
              icon="pi pi-search"
              class="p-button-rounded p-button-text p-button-sm"
              @click="locateThing(thing)"
              tooltip="Locate on map"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import ProgressSpinner from 'primevue/progressspinner'
import { locationService } from '../../services/location'

// Import Leaflet using ES Module syntax - but don't initialize it yet
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  // Location object that contains the floor plan
  location: {
    type: Object,
    required: true
  },
  // Things to display on the floor plan
  things: {
    type: Array,
    required: true
  },
  // Height of the map
  height: {
    type: String,
    default: '500px'
  },
  // Whether the map is editable
  editable: {
    type: Boolean,
    default: false
  },
  // Whether to show the upload option if no floor plan exists
  showUpload: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update-thing-position', 'upload-floor-plan', 'thing-click'])

// State
const map = ref(null)
const loading = ref(true)
const editMode = ref(false)
const showLegend = ref(false)
const thingMarkers = ref({}) // Map of thing ID to marker
const markerLayer = ref(null)
const mapInitialized = ref(false)
const initAttempted = ref(false)
const initTimer = ref(null)
const blobUrl = ref(null)  // To store the blob URL for the image

// Check if the location has a floor plan
const hasFloorPlan = computed(() => {
  return props.location && props.location.floorplan;
})

// Get unique thing types for legend
const uniqueThingTypes = computed(() => {
  const typeCounts = {}
  
  props.things.forEach(thing => {
    if (!typeCounts[thing.type]) {
      typeCounts[thing.type] = {
        type: thing.type,
        label: getThingTypeName(thing.type),
        count: 0
      }
    }
    typeCounts[thing.type].count++
  })
  
  return Object.values(typeCounts)
})

// Initialize map when component is mounted
onMounted(() => {
  // Defer initialization to avoid DOM issues
  if (hasFloorPlan.value) {
    fetchFloorPlanImage().then(() => {
      scheduleMapInitialization();
    });
  } else {
    loading.value = false;
  }
})

// Clean up on unmount
onBeforeUnmount(() => {
  // Clear any pending timers
  if (initTimer.value) {
    clearTimeout(initTimer.value);
  }
  
  // Clean up the map
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
  
  // Release any blob URLs
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
    blobUrl.value = null;
  }
})

// Watch for changes to things
watch(() => props.things, () => {
  if (mapInitialized.value) {
    renderThingMarkers();
  }
}, { deep: true })

// Watch for changes to floorplan
watch(() => hasFloorPlan.value, (newValue) => {
  if (newValue && !mapInitialized.value) {
    fetchFloorPlanImage().then(() => {
      scheduleMapInitialization();
    });
  }
})

// Fetch the floor plan image with CORS handling
const fetchFloorPlanImage = async () => {
  if (!hasFloorPlan.value) return;
  
  try {
    // Get a blob URL for the image using the location service
    blobUrl.value = await locationService.getFloorPlanImageUrl(props.location);
    console.log("Blob URL created:", blobUrl.value ? "Success" : "Failed");
    return !!blobUrl.value;
  } catch (error) {
    console.error("Error fetching floor plan image:", error);
    return false;
  }
}

// Schedule map initialization with increasing delays
const scheduleMapInitialization = () => {
  // Clear any previous timer
  if (initTimer.value) {
    clearTimeout(initTimer.value);
  }
  
  // Set timeouts with increasing delays to handle various timing issues
  const attemptInit = (delay) => {
    console.log(`Scheduling map initialization in ${delay}ms`);
    initTimer.value = setTimeout(() => {
      // Make sure we still need to initialize
      if (!mapInitialized.value && hasFloorPlan.value) {
        initMap().then(success => {
          if (!success && delay < 2000) {
            // If initialization failed and we haven't waited too long, try again with longer delay
            attemptInit(delay * 2);
          }
        });
      }
    }, delay);
  };
  
  // Start with a short delay
  attemptInit(200);
}

// Initialize the map with floor plan
const initMap = async () => {
  try {
    // Mark that we've attempted initialization
    initAttempted.value = true;
    
    // Find the map container element
    const mapElement = document.getElementById('floorplan-map');
    console.log("Initializing map, container element:", mapElement);
    
    if (!mapElement) {
      console.error('Map container element not found');
      return false;
    }
    
    // Fix Leaflet icon paths
    fixLeafletIconPaths();
    
    // Create a simple CRS to use pixel coordinates
    const mapOptions = {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 3,
      zoomControl: true
    };
    
    // Create map with the element
    map.value = L.map('floorplan-map', mapOptions);
    
    // Load the floor plan image
    await loadFloorPlanImage();
    
    // Mark map as initialized
    mapInitialized.value = true;
    
    // Create a layer for markers
    markerLayer.value = L.layerGroup().addTo(map.value);
    
    // Render markers for things
    renderThingMarkers();
    
    loading.value = false;
    
    console.log("Map initialized successfully");
    return true;
  } catch (error) {
    console.error('Error initializing map:', error);
    loading.value = false;
    return false;
  }
}

// Load the floor plan image and set up the map
const loadFloorPlanImage = () => {
  return new Promise((resolve, reject) => {
    if (!blobUrl.value) {
      reject('No floor plan blob URL available');
      return;
    }
    
    console.log("Loading floor plan image from blob URL");
    
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate bounds based on image dimensions
        const width = img.width;
        const height = img.height;
        console.log("Image loaded successfully, dimensions:", width, "x", height);
        
        const bounds = [[0, 0], [height, width]];
        
        // Add the floor plan as an image overlay
        L.imageOverlay(blobUrl.value, bounds).addTo(map.value);
        
        // Set the view to show the entire floor plan
        map.value.fitBounds(bounds);
        
        resolve();
      } catch (error) {
        console.error("Error setting up floor plan:", error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Failed to load floor plan image:', error);
      reject('Failed to load floor plan image. Check network tab for details.');
    };
    
    img.src = blobUrl.value;
  });
}

// Render markers for things
const renderThingMarkers = () => {
  if (!map.value || !markerLayer.value) return;
  
  // Clear existing markers
  markerLayer.value.clearLayers();
  thingMarkers.value = {};
  
  // Add markers for things with x,y coordinates
  props.things.forEach(thing => {
    const hasCoords = thing.metadata && 
                     thing.metadata.coordinates && 
                     typeof thing.metadata.coordinates.x !== 'undefined' && 
                     typeof thing.metadata.coordinates.y !== 'undefined';
    
    let position;
    
    if (hasCoords) {
      // Use stored coordinates
      position = [
        thing.metadata.coordinates.y,
        thing.metadata.coordinates.x
      ];
    } else if (editMode.value) {
      // In edit mode, place things without coordinates at the center
      const bounds = map.value.getBounds();
      position = [
        (bounds.getNorth() + bounds.getSouth()) / 2,
        (bounds.getEast() + bounds.getWest()) / 2
      ];
    } else {
      // Skip things without coordinates in view mode
      return;
    }
    
    // Create custom marker icon based on thing type
    const icon = L.divIcon({
      className: 'custom-marker-icon',
      html: `<div class="marker-dot" style="background-color: ${getMarkerColor(thing.type)}"></div>
             <div class="marker-label">${thing.name}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
    
    // Create marker with custom icon
    const marker = L.marker(position, {
      icon: icon,
      draggable: editMode.value,
      title: thing.name
    });
    
    // Bind popup
    marker.bindPopup(`
      <div class="thing-popup">
        <h3>${thing.name}</h3>
        <p class="code">${thing.code || ''}</p>
        <div class="badge badge-${thing.type}">${getThingTypeName(thing.type)}</div>
        <button class="view-button" data-thing-id="${thing.id}">View Details</button>
      </div>
    `);
    
    // Setup dragging events for edit mode
    if (editMode.value) {
      marker.on('dragend', (event) => {
        const newPos = event.target.getLatLng();
        updateThingPosition(thing, newPos.lng, newPos.lat);
      });
    }
    
    // Handle popup open
    marker.on('popupopen', (e) => {
      // Find the view button in the popup
      const button = document.querySelector(`.view-button[data-thing-id="${thing.id}"]`);
      if (button) {
        // Add click event
        button.addEventListener('click', () => {
          emit('thing-click', thing);
        });
      }
    });
    
    // Add marker to layer and track it
    marker.addTo(markerLayer.value);
    thingMarkers.value[thing.id] = marker;
  });
}

// Update thing position (x,y coordinates)
const updateThingPosition = (thing, x, y) => {
  emit('update-thing-position', {
    thingId: thing.id,
    coordinates: { x, y }
  });
}

// Toggle edit mode
const toggleEditMode = () => {
  editMode.value = !editMode.value;
  
  // Re-render markers with/without draggable property
  renderThingMarkers();
}

// Locate a thing on the map
const locateThing = (thing) => {
  const marker = thingMarkers.value[thing.id];
  if (marker) {
    map.value.setView(marker.getLatLng(), map.value.getZoom());
    marker.openPopup();
  }
}

// Handle floor plan upload
const handleUpload = (event) => {
  const file = event.files[0];
  if (!file) return;
  
  // We'll use this file to upload to PocketBase
  emit('upload-floor-plan', file);
  
  loading.value = true;
}

// Fix Leaflet icon paths
const fixLeafletIconPaths = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
  });
}

// Get color for marker based on thing type
const getMarkerColor = (type) => {
  const colors = {
    'reader': '#3b82f6',      // blue
    'controller': '#8b5cf6',  // purple
    'lock': '#f59e0b',        // amber
    'temperature-sensor': '#10b981', // green
    'humidity-sensor': '#06b6d4',    // cyan
    'hvac': '#0ea5e9',        // sky blue
    'lighting': '#f59e0b',    // amber
    'camera': '#ef4444',      // red
    'motion-sensor': '#6366f1', // indigo
    'occupancy-sensor': '#f97316' // orange
  };
  
  return colors[type] || '#6b7280'; // gray default
}

// Get thing type name
const getThingTypeName = (type) => {
  const names = {
    'reader': 'Reader',
    'controller': 'Controller',
    'lock': 'Lock',
    'temperature-sensor': 'Temperature Sensor',
    'humidity-sensor': 'Humidity Sensor',
    'hvac': 'HVAC Unit',
    'lighting': 'Lighting',
    'camera': 'Camera',
    'motion-sensor': 'Motion Sensor',
    'occupancy-sensor': 'Occupancy Sensor'
  };
  
  return names[type] || type;
}
</script>

<style scoped>
.floor-plan-map {
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1000;
}

.upload-container {
  height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 6px;
}

.upload-prompt {
  text-align: center;
  padding: 2rem;
}

.edit-panel {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

:deep(.custom-marker-icon) {
  background: none;
  border: none;
  position: relative;
}

:deep(.marker-dot) {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
}

:deep(.marker-label) {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1px 4px;
  border-radius: 2px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.thing-popup) {
  min-width: 180px;
  padding: 6px;
}

:deep(.thing-popup h3) {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

:deep(.thing-popup .code) {
  font-family: monospace;
  color: #666;
  margin: 0 0 8px 0;
  font-size: 0.75rem;
}

:deep(.thing-popup .badge) {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 10px;
}

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

:deep(.badge-reader) { background-color: #dbeafe; color: #1e40af; }
:deep(.badge-controller) { background-color: #ede9fe; color: #5b21b6; }
:deep(.badge-lock) { background-color: #ffedd5; color: #9a3412; }
:deep(.badge-temperature-sensor) { background-color: #dcfce7; color: #166534; }
:deep(.badge-humidity-sensor) { background-color: #cffafe; color: #0e7490; }
:deep(.badge-hvac) { background-color: #e0f2fe; color: #0c4a6e; }
:deep(.badge-lighting) { background-color: #fef9c3; color: #854d0e; }
:deep(.badge-camera) { background-color: #fee2e2; color: #b91c1c; }
:deep(.badge-motion-sensor) { background-color: #e0e7ff; color: #3730a3; }
:deep(.badge-occupancy-sensor) { background-color: #ffedd5; color: #9a3412; }
</style>
