// src/composables/useGlobalMap.js - Fixed marker visibility issue
import { ref, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/leaflet.markercluster.js'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'

/**
 * Composable for global map operations
 * Provides utilities for rendering and interacting with global maps
 */
export function useGlobalMap() {
  const { performOperation } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Ensure types are loaded
  typesStore.loadLocationTypes()
  
  // State
  const map = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const markersLayer = ref(null)
  const locationMarkers = ref({})
  const mapInitialized = ref(false)
  const savedMapState = ref(null)
  
  /**
   * Initialize the map with a container element ID
   * @param {string} containerId - ID of the container element
   * @param {Object} options - Map initialization options
   * @returns {boolean} - Initialization success status
   */
  const initMap = (containerId, options = {}) => {
    loading.value = true
    
    try {
      // Fix Leaflet icon paths (common issue in bundled apps)
      fixLeafletIconPaths()
      
      // Initialize map with improved options
      map.value = L.map(containerId, {
        center: [39.8283, -98.5795], // Default center on US
        zoom: 5,
        zoomControl: true,
        zoomAnimationThreshold: 4,
        zoomSnap: 0.5,
        wheelPxPerZoomLevel: 120,
        maxBoundsViscosity: 0.8,
        ...options
      })
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 2,
        noWrap: true
      }).addTo(map.value)
      
      // Initialize marker cluster group with improved settings
      markersLayer.value = L.markerClusterGroup({
        disableClusteringAtZoom: 19,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
        animate: false,
        animateAddingMarkers: false,
        iconCreateFunction: (cluster) => {
          // Custom cluster icon with more visible styling
          const count = cluster.getChildCount()
          let className
          
          if (count < 10) {
            className = 'marker-cluster-small'
          } else if (count < 50) {
            className = 'marker-cluster-medium'
          } else {
            className = 'marker-cluster-large'
          }
          
          return new L.DivIcon({
            html: `<div><span>${count}</span></div>`,
            className: `marker-cluster ${className}`,
            iconSize: new L.Point(40, 40)
          })
        }
      }).addTo(map.value)
      
      // Add a home button to reset the view
      addHomeControl()
      
      // Handle zoom events to prevent issues with marker positioning
      map.value.on('zoomstart', () => {
        map.value._isZooming = true
      })
      
      map.value.on('zoomend', () => {
        map.value._isZooming = false
      })
      
      // Add window resize handler
      window.addEventListener('resize', handleResize)
      
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
   * Handle window resize events
   */
  const handleResize = () => {
    if (!map.value) return
    
    // If a zoom animation is in progress, defer the resize
    if (map.value._isZooming) {
      setTimeout(handleResize, 300)
      return
    }
    
    // Force a map redraw when container resizes
    try {
      // Stop any current animations before invalidating
      if (map.value._pathZoom) {
        map.value._pathZoom = null
      }
      
      map.value.invalidateSize({ animate: false, pan: false, debounceMoveend: true })
      
      if (savedMapState.value && savedMapState.value.bounds && savedMapState.value.bounds.isValid()) {
        // Re-fit to bounds after resize, but avoid animation
        map.value.fitBounds(savedMapState.value.bounds, {
          padding: [50, 50],
          maxZoom: 8,
          animate: false
        })
      }
    } catch (err) {
      console.error('Error handling resize:', err)
    }
  }
  
  /**
   * Add home button for resetting view
   */
  const addHomeControl = () => {
    const homeControl = L.control({ position: 'topleft' })
    homeControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar')
      const button = L.DomUtil.create('a', '', div)
      button.href = '#'
      button.title = 'Show All Locations'
      button.innerHTML = '<i class="pi pi-home"></i>'
      button.role = 'button'
      button.style.fontWeight = 'bold'
      button.style.display = 'flex'
      button.style.alignItems = 'center'
      button.style.justifyContent = 'center'
      
      L.DomEvent.disableClickPropagation(div)
      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        centerToAllLocations()
      })
      
      return div
    }
    homeControl.addTo(map.value)
  }
  
  /**
   * Render location markers on the map
   * @param {Array} locations - Array of locations to render
   * @param {Array} edges - Array of edges for location mapping
   */
  const renderMarkers = (locations, edges = []) => {
    if (!map.value || !markersLayer.value) return
    
    // If a zoom animation is in progress, defer marker rendering
    if (map.value._isZooming) {
      setTimeout(() => renderMarkers(locations, edges), 300)
      return
    }
    
    // Clear existing markers
    markersLayer.value.clearLayers()
    locationMarkers.value = {}
    
    // Track valid marker coordinates for bounds calculation
    const validMarkerPositions = []
    
    // Add markers for each location
    locations.forEach(location => {
      // Skip if no valid coordinates
      if (!hasValidCoordinates(location)) return
      
      // Get coordinates
      const lat = location.metadata.coordinates.lat
      const lng = location.metadata.coordinates.lng || location.metadata.coordinates.long
      
      // Track position for bounds calculation
      validMarkerPositions.push([lat, lng])
      
      // Find the edge for this location
      const edge = edges.find(e => e.id === location.edge_id)
      
      // Create a custom icon based on location type
      const icon = createCustomIcon(location.type)
      
      // Create marker with custom icon
      const marker = L.marker([lat, lng], {
        title: location.name,
        icon: icon,
        riseOnHover: true,
        riseOffset: 250
      })
      
      // Get location type name - use the function provided by the component if available
      const typeName = location._getTypeName 
        ? location._getTypeName() 
        : getLocationTypeName(location.type)
      
      // Build popup content
      const edgeName = edge ? edge.name : 'Unknown Edge'
      
      marker.bindPopup(`
        <div class="location-popup">
          <h3>${location.name}</h3>
          <p class="code">${location.code || ''}</p>
          <p class="edge"><strong>Edge:</strong> ${edgeName}</p>
          <div class="badge badge-${location.type}">${typeName}</div>
          <button class="view-button" data-location-id="${location.id}">View Details</button>
        </div>
      `, {
        maxWidth: 300,
        minWidth: 200
      })
      
      // Handle popup open with improved event handling
      marker.on('popupopen', () => {
        setTimeout(() => {
          // Find the view button in the popup
          const button = document.querySelector(`.view-button[data-location-id="${location.id}"]`)
          if (button) {
            // Remove any existing event listeners to prevent duplicates
            const newButton = button.cloneNode(true)
            button.parentNode.replaceChild(newButton, button)
            
            // Add click event
            newButton.addEventListener('click', () => {
              // Create custom event
              const event = new CustomEvent('location-click', {
                detail: { location }
              })
              document.dispatchEvent(event)
            })
          }
        }, 10)
      })
      
      // IMPORTANT FIX: Add marker directly to the marker layer
      markersLayer.value.addLayer(marker)
      
      // Store marker reference for later use
      locationMarkers.value[location.id] = marker
    })
    
    // Center map to show all markers if there are any
    if (validMarkerPositions.length > 0) {
      try {
        const bounds = L.latLngBounds(validMarkerPositions)
        
        // Only perform bounds fitting if we have a reasonable map area
        if (bounds.isValid()) {
          map.value.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 8,
            animate: false
          })
          
          // Save these bounds for later recentering
          savedMapState.value = {
            bounds: bounds
          }
        } else {
          console.warn('Invalid bounds created from markers')
        }
      } catch (err) {
        console.error('Error fitting bounds:', err)
      }
    }
  }
  
  /**
   * Center map to show all locations
   */
  const centerToAllLocations = () => {
    if (!map.value) return
    
    // If a zoom animation is in progress, defer this operation
    if (map.value._isZooming) {
      setTimeout(centerToAllLocations, 300)
      return
    }
    
    if (savedMapState.value && savedMapState.value.bounds) {
      // Use saved bounds
      try {
        map.value.fitBounds(savedMapState.value.bounds, {
          padding: [50, 50],
          maxZoom: 8,
          animate: false
        })
      } catch (err) {
        console.error('Error fitting to saved bounds:', err)
      }
    }
  }
  
  /**
   * Center to a specific location
   * @param {Object} coordinates - {lat, lng} coordinates
   */
  const centerToLocation = (coordinates) => {
    if (!map.value || !coordinates) return
    
    try {
      map.value.setView([coordinates.lat, coordinates.lng], 14, {
        animate: true,
        duration: 0.5
      })
    } catch (err) {
      console.error('Error centering map to location:', err)
    }
  }
  
  /**
   * Find a marker by location ID
   * @param {string} locationId - Location ID
   * @returns {Object} - Leaflet marker
   */
  const findMarkerById = (locationId) => {
    return locationMarkers.value[locationId]
  }
  
  /**
   * Create custom icon based on location type
   * @param {string} locationType - Location type code
   * @returns {Object} - Leaflet icon
   */
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
    }
    
    const color = colorMap[locationType] || '#6b7280'
    
    // IMPORTANT FIX: Ensure the HTML structure matches what the CSS expects
    return L.divIcon({
      className: 'custom-location-marker',
      html: `<div class="location-marker-dot" style="background-color: ${color}"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -10]
    })
  }
  
  /**
   * Check if location has valid coordinates
   * @param {Object} location - Location object
   * @returns {boolean} - True if coordinates are valid
   */
  const hasValidCoordinates = (location) => {
    return location.metadata && 
           location.metadata.coordinates && 
           location.metadata.coordinates.lat && 
           (location.metadata.coordinates.lng || location.metadata.coordinates.long)
  }
  
  /**
   * Get location type name from code
   * @param {string} typeCode - Location type code
   * @returns {string} - Display name
   */
  const getLocationTypeName = (typeCode) => {
    // Try to get name from the types store first
    if (typesStore.locationTypes && typesStore.locationTypes.length > 0) {
      return typesStore.getTypeName(typeCode, 'locationTypes')
    }
    
    // Fallback to hardcoded types
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
    // Remove resize handler
    window.removeEventListener('resize', handleResize)
    
    // Clean up the map
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
    locationMarkers,
    
    // Methods
    initMap,
    renderMarkers,
    centerToAllLocations,
    centerToLocation,
    findMarkerById,
    hasValidCoordinates,
    cleanup
  }
}
