// src/composables/useDashboard.js
import { ref, computed } from 'vue'
import { edgeService, locationService, thingService, clientService } from '../services/index'
import { useAuditLogs } from './useAuditLogs'
import { useApiOperation } from './useApiOperation'
import configService from '../services/config/configService'

/**
 * Composable for dashboard functionality
 * Uses ApiOperation for consistent API handling
 * @returns {Object} - Dashboard state and methods
 */
export function useDashboard() {
  // Direct state with initial values to prevent null
  const edgesCount = ref(0)
  const locationsCount = ref(0)
  const thingsCount = ref(0)
  const clientsCount = ref(0)
  
  // Activity data from audit logs
  const activity = ref([])
  
  // Main loading state
  const loading = ref(false)
  
  // Use API operation for consistent handling
  const { performOperation } = useApiOperation()
  
  // Load audit logs using the useAuditLogs composable
  const { auditLogs, loading: auditLoading, loadRecentLogs } = useAuditLogs()
  
  /**
   * Fetch all dashboard data
   * @param {boolean} [forceRefresh=false] - Whether to force a refresh bypassing cache
   * @returns {Promise<void>}
   */
  const fetchDashboardData = async (forceRefresh = false) => {
    loading.value = true
    
    try {
      // Fetch entity counts in parallel
      await Promise.all([
        fetchEdgesCount(forceRefresh),
        fetchLocationsCount(forceRefresh),
        fetchThingsCount(forceRefresh),
        fetchClientsCount(forceRefresh),
        fetchRecentActivity(forceRefresh)
      ])
      
      // Copy the audit logs to our activity ref
      activity.value = [...auditLogs.value]
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch edges count using API operation pattern
   * @param {boolean} [skipCache=false] - Whether to skip cache
   */
  const fetchEdgesCount = async (skipCache = false) => {
    return performOperation(
      () => edgeService.getList({ 
        rows: 1,
        skipCache 
      }),
      {
        errorMessage: 'Failed to load edges count',
        collection: 'edges', // For cache management
        onSuccess: (response) => {
          edgesCount.value = response.data.totalItems || 0
          return edgesCount.value
        }
      }
    )
  }
  
  /**
   * Fetch locations count using API operation pattern
   * @param {boolean} [skipCache=false] - Whether to skip cache
   */
  const fetchLocationsCount = async (skipCache = false) => {
    return performOperation(
      () => locationService.getList({ 
        rows: 1,
        skipCache 
      }),
      {
        errorMessage: 'Failed to load locations count',
        collection: 'locations', // For cache management
        onSuccess: (response) => {
          locationsCount.value = response.data.totalItems || 0
          return locationsCount.value
        }
      }
    )
  }
  
  /**
   * Fetch things count using API operation pattern
   * @param {boolean} [skipCache=false] - Whether to skip cache
   */
  const fetchThingsCount = async (skipCache = false) => {
    return performOperation(
      () => thingService.getList({ 
        rows: 1,
        skipCache 
      }),
      {
        errorMessage: 'Failed to load things count',
        collection: 'things', // For cache management
        onSuccess: (response) => {
          thingsCount.value = response.data.totalItems || 0
          return thingsCount.value
        }
      }
    )
  }
  
  /**
   * Fetch clients count using API operation pattern
   * @param {boolean} [skipCache=false] - Whether to skip cache
   */
  const fetchClientsCount = async (skipCache = false) => {
    return performOperation(
      () => clientService.getList({ 
        rows: 1,
        skipCache 
      }),
      {
        errorMessage: 'Failed to load clients count',
        collection: 'clients', // For cache management
        onSuccess: (response) => {
          clientsCount.value = response.data.totalItems || 0
          return clientsCount.value
        }
      }
    )
  }
  
  /**
   * Fetch recent activity from audit logs
   * @param {boolean} [forceRefresh=false] - Whether to force a refresh
   */
  const fetchRecentActivity = async (forceRefresh = false) => {
    try {
      // Use the audit logs composable to fetch activity
      const logs = await loadRecentLogs({ 
        limit: 15,
        skipFiltering: true, // Show all activity types, not just "_request" ones
        skipCache: forceRefresh
      })
      
      return logs
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }
  
  /**
   * Open Grafana dashboard in a new tab
   */
  const openGrafana = () => {
    const grafanaUrl = configService.getGrafanaDashboardUrl('iot-overview')
    window.open(grafanaUrl, '_blank')
  }

  return {
    // State
    edgesCount,
    locationsCount,
    thingsCount,
    clientsCount,
    activity,
    loading: computed(() => loading.value || auditLoading.value), // Combined loading state
    
    // Methods
    fetchDashboardData,
    fetchRecentActivity,
    openGrafana
  }
}
