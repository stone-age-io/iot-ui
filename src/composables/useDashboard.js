// src/composables/useDashboard.js
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { apiHelpers } from '../services/api'
import { useEdge } from './useEdge'
import { useLocation } from './useLocation' 
import { useThing } from './useThing'
import { useApiOperation } from './useApiOperation'
import configService from '../services/config/configService'

/**
 * Composable for dashboard-related functionality
 * Centralizes dashboard data fetching and activity handling
 */
export function useDashboard() {
  const toast = useToast()
  const { performOperation } = useApiOperation()
  
  // Use entity composables
  const { edges, loading: edgesLoading, fetchEdges } = useEdge()
  const { locations, loading: locationsLoading, fetchLocations } = useLocation()
  const { things, loading: thingsLoading, fetchThings } = useThing()
  
  // Additional state
  const clientsCount = ref(0)
  const activity = ref([])
  const loading = ref(false)
  
  // Computed values
  const edgesCount = computed(() => edges.value.length)
  const locationsCount = computed(() => locations.value.length)
  const thingsCount = computed(() => things.value.length)
  
  /**
   * Fetch all dashboard data
   * @returns {Promise<void>}
   */
  const fetchDashboardData = async () => {
    loading.value = true
    
    try {
      // Fetch all entity data in parallel
      await Promise.all([
        fetchEdges(),
        fetchLocations(),
        fetchThings(),
        fetchClientsCount()
      ])
      
      // Fetch activity data
      await fetchActivityData()
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load dashboard data',
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch client count since we don't have a dedicated composable
   * @returns {Promise<number>} - Number of clients
   */
  const fetchClientsCount = async () => {
    return performOperation(
      () => apiHelpers.getList('/pb/api/collections/clients/records', { perPage: 1 }),
      {
        loadingRef: false,
        errorRef: null,
        errorMessage: 'Error fetching clients count',
        onSuccess: (response) => {
          clientsCount.value = response.data?.totalItems || 0
          return clientsCount.value
        },
        onError: () => {
          clientsCount.value = 0
          return 0
        }
      }
    )
  }
  
  /**
   * Fetch activity logs from PocketBase
   * @returns {Promise<Array>} - Formatted activity items
   */
  const fetchActivityData = async () => {
    return performOperation(
      () => apiHelpers.getList('/pb/api/logs', { sort: '-created', perPage: 5 }),
      {
        loadingRef: false,
        errorRef: null,
        errorMessage: 'Error fetching activity data',
        onSuccess: (response) => {
          if (response.data?.items?.length) {
            activity.value = response.data.items.map(log => ({
              type: getActivityTypeFromLog(log),
              title: formatLogMessage(log),
              timestamp: formatTimestamp(log.created)
            }))
            
            return activity.value
          } else {
            useMockActivityData()
            return activity.value
          }
        },
        onError: () => {
          useMockActivityData()
          return activity.value
        }
      }
    )
  }
  
  /**
   * Determine activity type based on log level and message
   * @param {Object} log - PocketBase log entry
   * @returns {string} - Activity type
   */
  const getActivityTypeFromLog = (log) => {
    // PocketBase log levels: 0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR
    switch (log.level) {
      case 3: return 'error'
      case 2: return 'warning'
      case 1: 
        if (log.message.toLowerCase().includes('created')) return 'create'
        if (log.message.toLowerCase().includes('updated')) return 'update'
        if (log.message.toLowerCase().includes('deleted')) return 'delete'
        if (log.message.toLowerCase().includes('login')) return 'login'
        return 'info'
      default: return 'info'
    }
  }
  
  /**
   * Format log message for display
   * Extract meaningful info from log message
   * @param {Object} log - PocketBase log entry
   * @returns {string} - Formatted message
   */
  const formatLogMessage = (log) => {
    // Clean up common log prefixes
    let message = log.message.replace(/^\[[^\]]+\]\s+/, '')
    
    // Handle API specific messages
    if (log.data && log.data.url) {
      message = parseApiLogMessage(log.data)
    }
    
    return message
  }
  
  /**
   * Parse API log messages to extract meaningful information
   * @param {Object} logData - Log data containing API details
   * @returns {string} - Formatted message
   */
  const parseApiLogMessage = (logData) => {
    const url = logData.url
    
    // Handle auth related messages
    if (url.includes('/auth-with-password')) {
      return 'User logged in'
    }
    
    // Extract collection and operation from URL
    if (url.includes('/api/collections/')) {
      return parseCollectionApiLogMessage(url, logData.method)
    }
    
    // Default fallback
    return `API request: ${logData.method} ${url}`
  }
  
  /**
   * Parse collection API log messages
   * @param {string} url - API URL
   * @param {string} method - HTTP method
   * @returns {string} - Formatted message
   */
  const parseCollectionApiLogMessage = (url, method) => {
    const urlParts = url.split('/')
    const collectionIndex = urlParts.findIndex(part => part === 'collections')
    
    if (collectionIndex >= 0 && collectionIndex + 1 < urlParts.length) {
      const collection = urlParts[collectionIndex + 1]
      const isRecord = urlParts.includes('records')
      const entityName = collection.slice(0, -1).charAt(0).toUpperCase() + collection.slice(0, -1).slice(1)
      
      // Format based on HTTP method
      if (method === 'POST' && isRecord) {
        return `New ${entityName} created`
      } else if (method === 'PATCH' && isRecord) {
        return `${entityName} updated`
      } else if (method === 'DELETE' && isRecord) {
        return `${entityName} deleted`
      }
    }
    
    return `API request to ${url}`
  }
  
  /**
   * Use mock activity data when logs aren't available
   */
  const useMockActivityData = () => {
    activity.value = [
      {
        type: 'login',
        title: 'Admin user logged in',
        timestamp: '10 minutes ago'
      },
      {
        type: 'create',
        title: 'New edge created',
        timestamp: '2 hours ago'
      },
      {
        type: 'update',
        title: 'Thing updated',
        timestamp: '4 hours ago'
      },
      {
        type: 'error',
        title: 'Failed login attempt',
        timestamp: 'Yesterday at 18:45'
      }
    ]
  }
  
  /**
   * Format timestamp for display
   * @param {string} isoDate - ISO date string
   * @returns {string} - Formatted date
   */
  const formatTimestamp = (isoDate) => {
    if (!isoDate) return ''
    
    const date = new Date(isoDate)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 2) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    // Format date for older entries
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  /**
   * Open Grafana dashboard
   */
  const openGrafana = () => {
    window.open(configService.env.GRAFANA_URL, '_blank')
  }
  
  return {
    // State
    edges,
    locations,
    things,
    clientsCount,
    activity,
    loading,
    
    // Computed
    edgesCount,
    locationsCount,
    thingsCount,
    
    // Methods
    fetchDashboardData,
    fetchActivityData,
    formatTimestamp,
    openGrafana
  }
}
