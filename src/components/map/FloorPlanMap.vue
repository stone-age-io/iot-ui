<!-- src/components/map/FloorPlanMap.vue (Updated) -->
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
    
    <!-- Map container - always render the div, but conditionally populate it -->
    <div class="relative">
      <!-- Map container must always exist, even if hidden -->
      <div id="floorplan-map" :style="{ 
        height: height || '500px', 
        display: hasFloorPlan && !loading ? 'block' : 'none' 
      }"></div>
      
      <!-- Legend panel -->
      <div 
        v-if="showLegend && mapInitialized" 
        class="legend-panel bg-white rounded-md shadow-md p-3"
        :class="legendPosition === 'left' ? 'legend-left' : 'legend-right'"
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
      
      <!-- Fallback message when floor plan load fails but hasFloorPlan is true -->
      <div 
        v-if="hasFloorPlan && initAttempted && !mapInitialized && !loading" 
        class="floor-plan-error p-4 bg-red-50 border border-red-200 rounded-md"
      >
        <div class="flex items-start">
          <i class="pi pi-exclamation-circle text-red-500 mt-0.5 mr-2"></i>
          <div>
            <p class="text-red-700 font-medium">Failed to load floor plan</p>
            <p class="text-red-600 text-sm mt-1">There was an error loading the floor plan image. Please try again later or upload a new image.</p>
            <div class="mt-3">
              <FileUpload
                v-if="showUpload"
                mode="basic"
                :maxFileSize="5000000"
                accept="image/*"
                :auto="true"
                chooseLabel="Upload New Floor Plan"
                @upload="onUpload"
                :customUpload="true"
                @uploader="handleUpload"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Edit mode panel -->
    <div v-if="editMode && mapInitialized" class="edit-panel p-3 bg-gray-100 border-t border-gray-300">
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import ProgressSpinner from 'primevue/progressspinner'

// Import from new service layer
import { locationService, thingService } from '../../services'

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
  },
  // Position for legend (left or right)
  legendPosition: {
    type: String,
    default: 'right'
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
const imageUrl = ref(null) // Direct image URL
const savedMapState = ref(null) // For saving map state during edit mode

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
    prepareImageUrl();
    scheduleMapInitialization();
  } else {
    loading.value = false;
  }
})

// Clean up on unmount
onUnmounted(() => {
  // Clear any pending timers
  if (initTimer.value) {
    clearTimeout(initTimer.value);
  }
  
  // Clean up the map
  if (map.value) {
    map.value.remove();
    map.value = null;
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
    prepareImageUrl();
    scheduleMapInitialization();
  }
})

// Prepare the direct image URL
const prepareImageUrl = () => {
  if (!hasFloorPlan.value) return;
  
  // Use service function to get URL
  imageUrl.value = locationService.getFloorPlanImageUrl(props.location);
  
  console.log("Prepared direct image URL:", imageUrl.value);
}

// Schedule map initialization with increasing delays
const scheduleMapInitialization = () => {
  // Clear any previous timer
  if (initTimer.value) {
    clearTimeout(initTimer.value);
  }
  
  // Helper to wait for the element to be available in the DOM
  const waitForElement = (selector, callback, maxAttempts = 10, delay = 200) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      const element = document.getElementById(selector);
      if (element) {
        callback(element);
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.error(`Element with ID ${selector} not found after ${maxAttempts} attempts`);
        loading.value = false;
        return;
      }
      
      console.log(`Element ${selector} not found, retry in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
      setTimeout(check, delay);
    };
    
    check();
  };
  
  // Wait for the map container to exist in the DOM before initializing
  waitForElement('floorplan-map', (element) => {
    console.log("Found map container element, initializing map");
    initMap().then(success => {
      if (!success) {
        console.error("Map initialization failed");
        loading.value = false;
      }
    });
  });
};

// Initialize the map with floor plan
const initMap = async () => {
  try {
    // Mark that we've attempted initialization
    initAttempted.value = true;
    
    // Find the map container element
    const mapElement = document.getElementById('floorplan-map');
    if (!mapElement) {
      console.error('Map container element not found');
      return false;
    }
    
    console.log("Initializing map with container element:", mapElement);
    
    // Fix Leaflet icon paths
    fixLeafletIconPaths();
    
    // Improved map options with better zoom levels
    const mapOptions = {
      crs: L.CRS.Simple,
      minZoom: -3,  // Allow zooming out further
      maxZoom: 4,   // Allow more zoom in for detail
      zoomControl: true,
      attributionControl: false, // Remove attribution control for cleaner UI
      center: [0, 0], // Default center (will be overridden)
      zoom: 0,        // Default zoom (will be overridden)
      maxBoundsViscosity: 0.9, // Makes bounds "sticky" but still navigable
      zoomSnap: 0.1,   // Allow finer zoom levels
      wheelPxPerZoomLevel: 120 // Adjust mouse wheel sensitivity
    };
    
    // Create map with the element
    map.value = L.map('floorplan-map', mapOptions);
    
    // Load the floor plan image
    await loadFloorPlanImage();
    
    // Add custom controls for legend and editing
    addMapControls();
    
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

// Add custom Leaflet controls to the map
const addMapControls = () => {
  // Create legend control
  const legendControl = L.control({ position: 'topright' });
  legendControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
    const button = L.DomUtil.create('a', '', div);
    button.href = '#';
    button.title = 'Toggle Legend';
    button.innerHTML = '<i class="pi pi-list"></i>';
    button.role = 'button';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.fontWeight = 'bold';
    
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.on(button, 'click', (e) => {
      L.DomEvent.preventDefault(e);
      showLegend.value = !showLegend.value;
    });
    
    return div;
  };
  legendControl.addTo(map.value);
  
  // Create edit mode control if editable
  if (props.editable) {
    const editControl = L.control({ position: 'topright' });
    editControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
      const button = L.DomUtil.create('a', '', div);
      button.href = '#';
      button.title = 'Toggle Edit Mode';
      button.innerHTML = '<i class="pi pi-pencil"></i>';
      button.role = 'button';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.setAttribute('data-edit-button', 'true');
      
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        toggleEditMode();
        
        // Update button appearance based on edit mode
        if (editMode.value) {
          button.innerHTML = '<i class="pi pi-check"></i>';
          button.style.backgroundColor = '#4ade80'; // Green background
          button.style.color = 'white';
        } else {
          button.innerHTML = '<i class="pi pi-pencil"></i>';
          button.style.backgroundColor = '';
          button.style.color = '';
        }
      });
      
      return div;
    };
    editControl.addTo(map.value);
  }
  
  // Add locate button for quick center
  const locateControl = L.control({ position: 'topleft' });
  locateControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
    const button = L.DomUtil.create('a', '', div);
    button.href = '#';
    button.title = 'Center Floor Plan';
    button.innerHTML = '<i class="pi pi-home"></i>';
    button.role = 'button';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.on(button, 'click', (e) => {
      L.DomEvent.preventDefault(e);
      centerFloorPlan();
    });
    
    return div;
  };
  locateControl.addTo(map.value);
}

// Load the floor plan image and set up the map using direct URL approach
const loadFloorPlanImage = () => {
  return new Promise((resolve, reject) => {
    if (!imageUrl.value) {
      console.error('No floor plan image URL available');
      reject('No floor plan image URL available');
      return;
    }
    
    console.log("Loading floor plan image from URL:", imageUrl.value);
    
    const img = new Image();
    
    // Set a timeout to handle cases where the image load hangs
    const timeoutId = setTimeout(() => {
      console.error('Floor plan image load timed out');
      reject('Floor plan image load timed out');
    }, 10000); // 10 second timeout
    
    img.onload = () => {
      clearTimeout(timeoutId);
      
      try {
        // Calculate bounds based on image dimensions
        const width = img.width;
        const height = img.height;
        console.log("Image loaded successfully, dimensions:", width, "x", height);
        
        // Set bounds correctly - using the image's pixel coordinates
        const bounds = [[0, 0], [height, width]];
        
        // Add the floor plan as an image overlay using the direct URL
        L.imageOverlay(imageUrl.value, bounds).addTo(map.value);
        
        // Get the container size to determine the best fitting zoom level
        const container = map.value.getContainer();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate image and container aspect ratios to determine appropriate padding
        const imageRatio = width / height;
        
        // Calculate proper max bounds with enough space for UI elements
        const maxBounds = L.latLngBounds(bounds).pad(0.75); // Add 75% padding
        map.value.setMaxBounds(maxBounds);
        
        // Save the initial view information for later reference
        savedMapState.value = {
          bounds: bounds,
          containerSize: { width: containerWidth, height: containerHeight },
          imageRatio: imageRatio
        };
        
        // Apply a minimal fitBounds to set the stage, but don't worry about perfect centering yet
        map.value.fitBounds(bounds, {
          padding: [20, 20], // Minimal padding, just to ensure bounds are set
          animate: false
        });
        
        // Use centerFloorPlan which has the optimized centering logic,
        // with a slight delay to ensure the map has fully initialized
        setTimeout(() => {
          centerFloorPlan();
          
          // Now that everything is properly positioned, finish the setup
          // Save proper view state after centering
          savedMapState.value.center = map.value.getCenter();
          savedMapState.value.zoom = map.value.getZoom();
        }, 150);
        
        resolve();
      } catch (error) {
        console.error("Error setting up floor plan:", error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      clearTimeout(timeoutId);
      console.error('Failed to load floor plan image:', error);
      
      // Try as fallback: directly add the image overlay with estimated dimensions
      try {
        console.log("Attempting fallback method with estimated dimensions");
        // Default dimensions for a placeholder
        const estimatedWidth = 1000;
        const estimatedHeight = 800;
        const bounds = [[0, 0], [estimatedHeight, estimatedWidth]];
        
        // Add the floor plan as an image overlay directly with the URL
        L.imageOverlay(imageUrl.value, bounds).addTo(map.value);
        
        // Get the container size
        const container = map.value.getContainer();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate aspect ratios for fallback
        const imageRatio = estimatedWidth / estimatedHeight;
        
        // Set max bounds
        map.value.setMaxBounds(L.latLngBounds(bounds).pad(0.75));
        
        // Save initial state
        savedMapState.value = {
          bounds: bounds,
          containerSize: { width: containerWidth, height: containerHeight },
          imageRatio: imageRatio
        };
        
        // Apply minimal bounds, then use the centerFloorPlan function
        map.value.fitBounds(bounds, {
          padding: [20, 20],
          animate: false
        });
        
        // Use centerFloorPlan for consistent behavior with a slight delay
        setTimeout(() => {
          centerFloorPlan();
          
          // Save proper view state after centering
          savedMapState.value.center = map.value.getCenter();
          savedMapState.value.zoom = map.value.getZoom();
        }, 150);
        
        resolve();
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
        reject('Failed to load floor plan image. Check network tab for details.');
      }
    };
    
    // Set crossOrigin if needed based on your server setup
    // img.crossOrigin = "anonymous";
    img.src = imageUrl.value;
  });
}

// Center the floor plan in view
const centerFloorPlan = () => {
  if (!map.value || !savedMapState.value) return;
  
  // Force a map size recalculation to handle any container size changes
  map.value.invalidateSize({reset: true});
  
  // Get current container dimensions
  const container = map.value.getContainer();
  const currentWidth = container.clientWidth;
  const currentHeight = container.clientHeight;
  
  // Calculate optimal zoom level based on image and container dimensions
  const imageRatio = savedMapState.value.imageRatio || 1;
  const containerRatio = currentWidth / currentHeight;
  
  // Use asymmetric padding for better aspect ratio handling
  let verticalPadding, horizontalPadding;
  
  if (imageRatio < containerRatio) {
    // Image is taller relative to container - use less padding to maximize image size
    verticalPadding = currentHeight * 0.08;  // 8% vertical padding
    horizontalPadding = currentWidth * 0.05;  // 5% horizontal padding
  } else {
    // Image is wider relative to container - use less padding to maximize image size
    verticalPadding = currentHeight * 0.05;  // 5% vertical padding
    horizontalPadding = currentWidth * 0.08;  // 8% horizontal padding
  }
  
  // Reset to the ideal view showing the entire floor plan with optimized padding
  map.value.fitBounds(savedMapState.value.bounds, {
    padding: [verticalPadding, horizontalPadding],
    maxZoom: 1.2, // Allow slightly higher zoom to make better use of space
    animate: true // Use animation for a smoother experience when manually centering
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
      // In edit mode, place things without coordinates at the center but spread them out slightly
      // This helps prevent markers from stacking directly on top of each other
      const bounds = map.value.getBounds();
      const centerY = (bounds.getNorth() + bounds.getSouth()) / 2;
      const centerX = (bounds.getEast() + bounds.getWest()) / 2;
      
      // Add a small random offset to spread out markers
      // Use the thing's ID hash to create a consistent offset for the same thing
      const hashCode = (s) => {
        return s.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
      };
      
      const hash = hashCode(thing.id);
      const offsetX = (hash % 20) / 100; // Small percentage of the map width
      const offsetY = ((hash >> 5) % 20) / 100; // Different offset for Y
      
      position = [
        centerY + offsetY,
        centerX + offsetX
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
      title: thing.name,
      autoPan: false, // Disable automatic panning when dragging to edges
      zIndexOffset: hasCoords ? 1000 : 500 // Place positioned markers on top
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
    
    // Setup dragging events for edit mode with improved behavior
    if (editMode.value) {
      // Store original map state when drag starts
      marker.on('dragstart', () => {
        marker._originalMapCenter = map.value.getCenter();
        marker._originalZoom = map.value.getZoom();
        
        // Disable other map interactions during drag
        if (map.value.scrollWheelZoom.enabled()) {
          marker._scrollWheelEnabled = true;
          map.value.scrollWheelZoom.disable();
        }
      });
      
      marker.on('drag', (event) => {
        // Keep the map view steady during drag
      });
      
      marker.on('dragend', (event) => {
        const newPos = event.target.getLatLng();
        updateThingPosition(thing, newPos.lng, newPos.lat);
        
        // Re-enable map interactions
        if (marker._scrollWheelEnabled) {
          map.value.scrollWheelZoom.enable();
        }
        
        // Restore original map view
        if (marker._originalMapCenter) {
          map.value.setView(
            marker._originalMapCenter, 
            marker._originalZoom, 
            { animate: false, duration: 0 }
          );
          delete marker._originalMapCenter;
          delete marker._originalZoom;
          delete marker._scrollWheelEnabled;
        }
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
  
  // If we have markers with coordinates, ensure they're visible by adjusting the view if needed
  // But only do this initial centering if we're not in edit mode
  if (!editMode.value && Object.keys(thingMarkers.value).length > 0) {
    const positionedMarkers = Object.values(thingMarkers.value).filter(m => {
      // Find markers that were placed using actual coordinates
      const id = Object.keys(thingMarkers.value).find(key => thingMarkers.value[key] === m);
      const thing = props.things.find(t => t.id === id);
      return thing && thing.metadata && thing.metadata.coordinates;
    });
    
    if (positionedMarkers.length > 0) {
      // Create a feature group to get bounds of all positioned markers
      const group = L.featureGroup(positionedMarkers);
      
      // Check if all markers are visible in current view
      const currentBounds = map.value.getBounds();
      const markerBounds = group.getBounds();
      
      // Only adjust view if some markers are outside current view
      if (!currentBounds.contains(markerBounds)) {
        // Extend current bounds to include marker bounds with padding
        const extendedBounds = currentBounds.extend(markerBounds);
        map.value.fitBounds(extendedBounds, {
          padding: [50, 50],
          maxZoom: map.value.getZoom(), // Don't zoom in further than current level
          animate: true
        });
      }
    }
  }
}

// Update thing position (x,y coordinates)
const updateThingPosition = (thing, x, y) => {
  emit('update-thing-position', {
    thingId: thing.id,
    coordinates: { x, y }
  });
}

// Toggle edit mode with improved state management
const toggleEditMode = () => {
  editMode.value = !editMode.value;
  
  if (editMode.value) {
    // Entering edit mode - save current state
    savedMapState.value = {
      center: map.value.getCenter(),
      zoom: map.value.getZoom(),
      bounds: map.value.getBounds()
    };
    
    // Restrict panning during edit mode
    const currentBounds = map.value.getBounds();
    const maxBounds = L.latLngBounds(currentBounds).pad(0.2); // Tighter restrictions during edit
    map.value.setMaxBounds(maxBounds);
    
    // Disable zoom during edit to prevent losing markers
    map.value.touchZoom.disable();
    map.value.doubleClickZoom.disable();
    map.value.scrollWheelZoom.disable();
    map.value.boxZoom.disable();
    map.value.keyboard.disable();
  } else {
    // Exiting edit mode - restore previous view
    if (savedMapState.value) {
      map.value.setView(
        savedMapState.value.center,
        savedMapState.value.zoom,
        { animate: false }
      );
      
      // Reset max bounds to original padding
      const maxBounds = L.latLngBounds(savedMapState.value.bounds).pad(0.5);
      map.value.setMaxBounds(maxBounds);
    }
    
    // Re-enable zoom controls
    map.value.touchZoom.enable();
    map.value.doubleClickZoom.enable();
    map.value.scrollWheelZoom.enable();
    map.value.boxZoom.enable();
    map.value.keyboard.enable();
  }
  
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

/* Legend positioning */
.legend-panel {
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 250px;
  max-height: 60%; 
  overflow-y: auto;
  z-index: 1000;
}

.legend-left {
  position: absolute;
  left: 10px;
  bottom: 30px;
}

.legend-right {
  position: absolute;
  right: 10px;
  bottom: 30px;
}

/* Marker styling */
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

/* Popup styling */
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

/* Badge colors */
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

/* Custom control styling overrides */
:deep(.leaflet-control a) {
  width: 30px;
  height: 30px;
  line-height: 30px;
  font-size: 16px;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

/* Make marker layer higher z-index than map controls */
:deep(.leaflet-marker-pane) {
  z-index: 1000 !important;
}

:deep(.leaflet-popup-pane) {
  z-index: 1001 !important;
}

:deep(.leaflet-tooltip-pane) {
  z-index: 1001 !important;
}
</style>
