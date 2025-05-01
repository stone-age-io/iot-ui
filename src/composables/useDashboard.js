// src/composables/useDashboard.js
import { ref, reactive } from 'vue'
import { edgeService, locationService, thingService, clientService } from '../services/index'
import { useAuditLogs } from './useAuditLogs'
import { useApiOperation } from './useApiOperation'
import configService from '../services/config/configService'

/**
 * Composable for dashboard functionality
 * Enhanced to properly handle activity data
 * @returns {Object} - Dashboard state and methods
 */
export function useDashboard() {
  // Direct state with initial values to prevent null
  const edgesCount = ref(0)
  const locationsCount = ref(0)
  const thingsCount = ref(0)
  const clientsCount = ref(0)
  
  // Activity data - this is a ref that will hold the array of activities
  const activity = ref([])
  
  // Loading state
  const loading = ref(false)
  
  // Status counts by type
  const statusCounts = reactive({
    active: 0,
    inactive: 0,
    warning: 0,
    error: 0
  })

  // Use API operation for consistent handling
  const { performOperation } = useApiOperation()
  
  // Load audit logs using the useAuditLogs composable
  const { auditLogs, loading: auditLoading, loadRecentLogs } = useAuditLogs()
  
  /**
   * Fetch all dashboard data
   * @returns {Promise<void>}
   */
  const fetchDashboardData = async () => {
    loading.value = true
    
    try {
      // Fetch entity counts in parallel
      await Promise.all([
        fetchEdgesCount(),
        fetchLocationsCount(),
        fetchThingsCount(),
        fetchClientsCount(),
        fetchRecentActivity()
      ])
      
      // Copy the audit logs to our activity ref
      // This ensures we have a clean reactive reference
      activity.value = [...auditLogs.value]
    } catch (error) {
      // Error handling without logging
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch edges count directly, no reactive data
   */
  const fetchEdgesCount = async () => {
    try {
      const { data } = await edgeService.getList({ rows: 1 })
      edgesCount.value = data.totalItems || 0
    } catch (error) {
      // Keep existing value on error
    }
  }
  
  /**
   * Fetch locations count directly
   */
  const fetchLocationsCount = async () => {
    try {
      const { data } = await locationService.getList({ rows: 1 })
      locationsCount.value = data.totalItems || 0
    } catch (error) {
      // Keep existing value on error
    }
  }
  
  /**
   * Fetch things count directly
   */
  const fetchThingsCount = async () => {
    try {
      const { data } = await thingService.getList({ rows: 1 })
      thingsCount.value = data.totalItems || 0
    } catch (error) {
      // Keep existing value on error
    }
  }
  
  /**
   * Fetch clients count directly
   */
  const fetchClientsCount = async () => {
    try {
      const { data } = await clientService.getList({ rows: 1 })
      clientsCount.value = data.totalItems || 0
    } catch (error) {
      // Keep existing value on error
    }
  }
  
  /**
   * Fetch recent activity from audit logs
   * Modified to be more inclusive in filtering
   */
  const fetchRecentActivity = async () => {
    try {
      // Use skipFiltering option to get more inclusive results
      // This will show all activity types, not just "_request" ones
      const logs = await loadRecentLogs({ 
        limit: 15,
        skipFiltering: true 
      })
      
      // The activity value will be updated in fetchDashboardData
      return logs
    } catch (error) {
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
    // State - these are simple refs with primitive values
    edgesCount,
    locationsCount,
    thingsCount,
    clientsCount,
    activity, 
    loading,
    statusCounts,
    
    // Methods
    fetchDashboardData,
    fetchRecentActivity, // Exposed for debugging if needed
    openGrafana
  }
}
