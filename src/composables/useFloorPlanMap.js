// src/composables/useFloorPlanMap.js
import { ref, computed, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApiOperation } from './useApiOperation'
import { locationService } from '../services'

/**
 * Composable for floor plan map operations
 * Provides utilities for rendering and interacting with floor plan maps
 */
export function useFloorPlanMap() {
  const { performOperation } = useApiOperation()
  
  // State
  const map = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const mapInitialized = ref(false)
  const thingMarkers = ref({})
  const markersLayer = ref(null)
  const savedMapState = ref(null)
  const editMode = ref(false)
  const imageUrl = ref(null)
  
  /**
   * Initialize the map with a container element ID
   * @param {string} containerId - ID of the container element
   * @param {Object} options - Map initialization options
   * @returns {boolean} - Initialization success status
   */
  const initMap = async (containerId, options = {}) => {
    loading.value = true
    
    try {
      // Fix Leaflet icon paths (common issue in bundled apps)
      fixLeafletIconPaths()
      
      // Find map container
      const mapElement = document.getElementById(containerId)
      if (!mapElement) {
        error.value = 'Map container element not found'
        return false
      }
      
      // Improved map options with better zoom levels
      const mapOptions = {
        crs: L.CRS.Simple,
        minZoom: -3,
        maxZoom: 4,
        zoomControl: true,
        attributionControl: false,
        center: [0, 0],
        zoom: 0,
        maxBoundsViscosity: 0.9,
        zoomSnap: 0.1,
        wheelPxPerZoomLevel: 120,
        ...options
      }
      
      // Initialize the map
      map.value = L.map(containerId, mapOptions)
      
      // Create a layer for markers
      markersLayer.value = L.layerGroup().addTo(map.value)
      
      // Add custom controls
      addMapControls()
      
      mapInitialized.value = true
      loading.value = false
      
      return true
    } catch (err) {
      console.error('Error initializing map:', err)
      error.value = 'Error initializing map: ' + err.message
      loading.value = false
      
      return false
    }
  }
  
  /**
   * Add custom controls to the map
   */
  const addMapControls = () => {
    if (!map.value) return
    
    // Create legend control
    const legendControl = L.control({ position: 'topright' })
    legendControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar')
      const button = L.DomUtil.create('a', '', div)
      button.href = '#'
      button.title = 'Toggle Legend'
      button.innerHTML = '<i class="pi pi-list"></i>'
      button.role = 'button'
      button.style.display = 'flex'
      button.style.alignItems = 'center'
      button.style.justifyContent = 'center'
      button.style.fontWeight = 'bold'
      
      L.DomEvent.disableClickPropagation(div)
      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        // Instead of directly modifying state, we emit an event in the component
        const event = new CustomEvent('toggle-legend')
        document.dispatchEvent(event)
      })
      
      return div
    }
    legendControl.addTo(map.value)
    
    // Create edit mode control
    const editControl = L.control({ position: 'topright' })
    editControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar')
      const button = L.DomUtil.create('a', '', div)
      button.href = '#'
      button.title = 'Toggle Edit Mode'
      button.innerHTML = '<i class="pi pi-pencil"></i>'
      button.role = 'button'
      button.style.display = 'flex'
      button.style.alignItems = 'center'
      button.style.justifyContent = 'center'
      button.setAttribute('data-edit-button', 'true')
      
      L.DomEvent.disableClickPropagation(div)
      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        toggleEditMode()
        
        // Update button appearance based on edit mode
        if (editMode.value) {
          button.innerHTML = '<i class="pi pi-check"></i>'
          button.style.backgroundColor = '#4ade80' // Green background
          button.style.color = 'white'
        } else {
          button.innerHTML = '<i class="pi pi-pencil"></i>'
          button.style.backgroundColor = ''
          button.style.color = ''
        }
      })
      
      return div
    }
    editControl.addTo(map.value)
    
    // Add home button to reset the view
    const homeControl = L.control({ position: 'topleft' })
    homeControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar')
      const button = L.DomUtil.create('a', '', div)
      button.href = '#'
      button.title = 'Center Floor Plan'
      button.innerHTML = '<i class="pi pi-home"></i>'
      button.role = 'button'
      button.style.display = 'flex'
      button.style.alignItems = 'center'
      button.style.justifyContent = 'center'
      
      L.DomEvent.disableClickPropagation(div)
      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        centerFloorPlan()
      })
      
      return div
    }
    homeControl.addTo(map.value)
  }
  
  /**
   * Load a floor plan image from a location
   * @param {Object} location - Location object with floorplan field
   * @returns {Promise<boolean>} - Loading success status
   */
  const loadFloorPlan = async (location) => {
    if (!map.value || !location || !location.floorplan) {
      error.value = 'Invalid location or missing floor plan'
      return false
    }
    
    imageUrl.value = locationService.getFloorPlanImageUrl(location)
    
    if (!imageUrl.value) {
      error.value = 'Could not get floor plan image URL'
      return false
    }
    
    try {
      return new Promise((resolve, reject) => {
        const img = new Image()
        
        // Set a timeout for image loading
        const timeoutId = setTimeout(() => {
          reject('Floor plan image load timed out')
        }, 10000)
        
        img.onload = () => {
          clearTimeout(timeoutId)
          
          try {
            // Calculate bounds based on image dimensions
            const width = img.width
            const height = img.height
            
            // Set bounds correctly
            const bounds = [[0, 0], [height, width]]
            
            // Add the floor plan as an image overlay
            L.imageOverlay(imageUrl.value, bounds).addTo(map.value)
            
            // Get container size
            const container = map.value.getContainer()
            const containerWidth = container.clientWidth
            const containerHeight = container.clientHeight
            
            // Calculate image ratio
            const imageRatio = width / height
            
            // Set max bounds with padding
            const maxBounds = L.latLngBounds(bounds).pad(0.75)
            map.value.setMaxBounds(maxBounds)
            
            // Save initial state
            savedMapState.value = {
              bounds,
              containerSize: { width: containerWidth, height: containerHeight },
              imageRatio
            }
            
            // Apply initial fit bounds
            map.value.fitBounds(bounds, {
              padding: [20, 20],
              animate: false
            })
            
            // Center the floor plan after a short delay
            setTimeout(() => {
              centerFloorPlan()
              
              // Save proper view state after centering
              savedMapState.value.center = map.value.getCenter()
              savedMapState.value.zoom = map.value.getZoom()
            }, 150)
            
            mapInitialized.value = true
            resolve(true)
          } catch (error) {
            reject(error)
          }
        }
        
        img.onerror = (err) => {
          clearTimeout(timeoutId)
          reject('Failed to load floor plan image: ' + err)
        }
        
        img.src = imageUrl.value
      })
    } catch (err) {
      console.error('Error loading floor plan:', err)
      error.value = 'Error loading floor plan: ' + err.message
      return false
    }
  }
  
  /**
   * Center the floor plan in view
   */
  const centerFloorPlan = () => {
    if (!map.value || !savedMapState.value) return
    
    // Force a map size recalculation
    map.value.invalidateSize({ reset: true })
    
    // Get current container dimensions
    const container = map.value.getContainer()
    const currentWidth = container.clientWidth
    const currentHeight = container.clientHeight
    
    // Calculate optimal zoom level
    const imageRatio = savedMapState.value.imageRatio || 1
    const containerRatio = currentWidth / currentHeight
    
    // Use asymmetric padding for better aspect ratio handling
    let verticalPadding, horizontalPadding
    
    if (imageRatio < containerRatio) {
      // Image is taller relative to container
      verticalPadding = currentHeight * 0.08
      horizontalPadding = currentWidth * 0.05
    } else {
      // Image is wider relative to container
      verticalPadding = currentHeight * 0.05
      horizontalPadding = currentWidth * 0.08
    }
    
    // Reset to the ideal view
    map.value.fitBounds(savedMapState.value.bounds, {
      padding: [verticalPadding, horizontalPadding],
      maxZoom: 1.2,
      animate: true
    })
  }
  
  /**
   * Render thing markers on the map
   * @param {Array} things - Array of things to render
   * @param {boolean} isEditMode - Whether to enable drag for markers
   */
  const renderThingMarkers = (things, isEditMode = false) => {
    if (!map.value || !markersLayer.value) return
    
    // Update edit mode state
    editMode.value = isEditMode
    
    // Clear existing markers
    markersLayer.value.clearLayers()
    thingMarkers.value = {}
    
    // Add markers for things with coordinates
    things.forEach(thing => {
      const hasCoords = thing.metadata && 
                       thing.metadata.coordinates && 
                       typeof thing.metadata.coordinates.x !== 'undefined' && 
                       typeof thing.metadata.coordinates.y !== 'undefined'
      
      let position
      
      if (hasCoords) {
        // Use stored coordinates
        position = [
          thing.metadata.coordinates.y,
          thing.metadata.coordinates.x
        ]
      } else if (editMode.value) {
        // In edit mode, place things without coordinates at the center 
        // but spread them out slightly
        const bounds = map.value.getBounds()
        const centerY = (bounds.getNorth() + bounds.getSouth()) / 2
        const centerX = (bounds.getEast() + bounds.getWest()) / 2
        
        // Add a small random offset
        const hashCode = (s) => {
          return s.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0)
            return a & a
          }, 0)
        }
        
        const hash = hashCode(thing.id)
        const offsetX = (hash % 20) / 100
        const offsetY = ((hash >> 5) % 20) / 100
        
        position = [
          centerY + offsetY,
          centerX + offsetX
        ]
      } else {
        // Skip things without coordinates in view mode
        return
      }
      
      // Create marker with appropriate styling based on thing type
      const marker = createThingMarker(thing, position, editMode.value)
      
      // Add to marker layer and tracking
      marker.addTo(markersLayer.value)
      thingMarkers.value[thing.id] = marker
    })
    
    // If we have markers with coordinates and not in edit mode, 
    // adjust view to make them visible
    if (!editMode.value && Object.keys(thingMarkers.value).length > 0) {
      const positionedMarkers = Object.values(thingMarkers.value).filter(m => {
        const id = Object.keys(thingMarkers.value).find(key => thingMarkers.value[key] === m)
        const thing = things.find(t => t.id === id)
        return thing && thing.metadata && thing.metadata.coordinates
      })
      
      if (positionedMarkers.length > 0) {
        // Create a feature group to get bounds
        const group = L.featureGroup(positionedMarkers)
        
        // Check if all markers are visible in current view
        const currentBounds = map.value.getBounds()
        const markerBounds = group.getBounds()
        
        // Only adjust view if some markers are outside current view
        if (!currentBounds.contains(markerBounds)) {
          const extendedBounds = currentBounds.extend(markerBounds)
          map.value.fitBounds(extendedBounds, {
            padding: [50, 50],
            maxZoom: map.value.getZoom(),
            animate: true
          })
        }
      }
    }
  }
  
  /**
   * Create a marker for a thing
   * @param {Object} thing - Thing object
   * @param {Array} position - [y, x] position for the marker
   * @param {boolean} draggable - Whether marker is draggable
   * @returns {Object} - Leaflet marker
   */
  const createThingMarker = (thing, position, draggable = false) => {
    // Get color for marker based on thing type
    const markerColor = getMarkerColor(thing.thing_type)
    
    // Create custom marker icon
    const icon = L.divIcon({
      className: 'custom-marker-icon',
      html: `<div class="marker-dot" style="background-color: ${markerColor}"></div>
             <div class="marker-label">${thing.name}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    })
    
    // Create marker with custom icon
    const marker = L.marker(position, {
      icon: icon,
      draggable: draggable,
      title: thing.name,
      autoPan: false,
      zIndexOffset: position ? 1000 : 500
    })
    
    // Bind popup
    marker.bindPopup(`
      <div class="thing-popup">
        <h3>${thing.name}</h3>
        <p class="code">${thing.thing_code || ''}</p>
        <div class="badge badge-${thing.thing_type}">${getThingTypeName(thing.thing_type)}</div>
        <button class="view-button" data-thing-id="${thing.id}">View Details</button>
      </div>
    `)
    
    // Setup dragging events for edit mode
    if (draggable) {
      // Store original map state when drag starts
      marker.on('dragstart', () => {
        marker._originalMapCenter = map.value.getCenter()
        marker._originalZoom = map.value.getZoom()
        
        // Disable other map interactions during drag
        if (map.value.scrollWheelZoom.enabled()) {
          marker._scrollWheelEnabled = true
          map.value.scrollWheelZoom.disable()
        }
      })
      
      marker.on('dragend', (event) => {
        const newPos = event.target.getLatLng()
        
        // Create a custom event for thing position update
        const updateEvent = new CustomEvent('thing-position-update', {
          detail: {
            thingId: thing.id,
            coordinates: { x: newPos.lng, y: newPos.lat }
          }
        })
        document.dispatchEvent(updateEvent)
        
        // Re-enable map interactions
        if (marker._scrollWheelEnabled) {
          map.value.scrollWheelZoom.enable()
        }
        
        // Restore original map view
        if (marker._originalMapCenter) {
          map.value.setView(
            marker._originalMapCenter, 
            marker._originalZoom, 
            { animate: false }
          )
          delete marker._originalMapCenter
          delete marker._originalZoom
          delete marker._scrollWheelEnabled
        }
      })
    }
    
    // Handle popup open
    marker.on('popupopen', () => {
      // Find the view button in the popup
      setTimeout(() => {
        const button = document.querySelector(`.view-button[data-thing-id="${thing.id}"]`)
        if (button) {
          // Remove any existing event listeners to prevent duplicates
          const newButton = button.cloneNode(true)
          button.parentNode.replaceChild(newButton, button)
          
          // Add click event that dispatches a custom event
          newButton.addEventListener('click', () => {
            const event = new CustomEvent('thing-click', {
              detail: { thing }
            })
            document.dispatchEvent(event)
          })
        }
      }, 10)
    })
    
    return marker
  }
  
  /**
   * Toggle edit mode for the map
   */
  const toggleEditMode = () => {
    editMode.value = !editMode.value
    
    if (!map.value) return
    
    if (editMode.value) {
      // Entering edit mode - save current state
      savedMapState.value = {
        center: map.value.getCenter(),
        zoom: map.value.getZoom(),
        bounds: map.value.getBounds()
      }
      
      // Restrict panning during edit mode
      const currentBounds = map.value.getBounds()
      const maxBounds = L.latLngBounds(currentBounds).pad(0.2)
      map.value.setMaxBounds(maxBounds)
      
      // Disable zoom during edit
      map.value.touchZoom.disable()
      map.value.doubleClickZoom.disable()
      map.value.scrollWheelZoom.disable()
      map.value.boxZoom.disable()
      map.value.keyboard.disable()
    } else {
      // Exiting edit mode - restore previous view
      if (savedMapState.value) {
        map.value.setView(
          savedMapState.value.center,
          savedMapState.value.zoom,
          { animate: false }
        )
        
        // Reset max bounds to original padding
        const maxBounds = L.latLngBounds(savedMapState.value.bounds).pad(0.5)
        map.value.setMaxBounds(maxBounds)
      }
      
      // Re-enable zoom controls
      map.value.touchZoom.enable()
      map.value.doubleClickZoom.enable()
      map.value.scrollWheelZoom.enable()
      map.value.boxZoom.enable()
      map.value.keyboard.enable()
    }
    
    // Dispatch event for edit mode change
    const event = new CustomEvent('edit-mode-change', {
      detail: { editMode: editMode.value }
    })
    document.dispatchEvent(event)
  }
  
  /**
   * Locate a thing on the map
   * @param {Object} thing - Thing to locate
   */
  const locateThing = (thing) => {
    const marker = thingMarkers.value[thing.id]
    if (marker && map.value) {
      map.value.setView(marker.getLatLng(), map.value.getZoom())
      marker.openPopup()
    }
  }
  
  /**
   * Get color for marker based on thing type
   * @param {string} type - Thing type code
   * @returns {string} - Color hex or name
   */
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
    }
    
    return colors[type] || '#6b7280' // gray default
  }
  
  /**
   * Get thing type display name
   * @param {string} type - Thing type code
   * @returns {string} - Display name
   */
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
    }
    
    return names[type] || type
  }
  
  /**
   * Fix Leaflet icon paths (common issue in bundled apps)
   */
  const fixLeafletIconPaths = () => {
    delete L.Icon.Default.prototype._getIconUrl
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
    })
  }
  
  /**
   * Clean up map resources
   */
  const cleanup = () => {
    if (map.value) {
      map.value.remove()
      map.value = null
    }
  }
  
  // Cleanup on component unmount
  onBeforeUnmount(() => {
    cleanup()
  })
  
  // Return public API
  return {
    // State
    map,
    loading,
    error,
    mapInitialized,
    thingMarkers,
    editMode,
    
    // Methods
    initMap,
    loadFloorPlan,
    renderThingMarkers,
    centerFloorPlan,
    toggleEditMode,
    locateThing,
    cleanup
  }
}
