// src/composables/useDashboard.js
import { ref, reactive } from 'vue'
import { edgeService, locationService, thingService, clientService } from '../services/index'
import { useAuditLogs } from './useAuditLogs'
import { useApiOperation } from './useApiOperation'
import configService from '../services/config/configService'

/**
 * Composable for dashboard functionality
 * @returns {Object} - Dashboard state and methods
 */
export function useDashboard() {
  // Direct state with initial values to prevent null
  const edgesCount = ref(0)
  const locationsCount = ref(0)
  const thingsCount = ref(0)
  const clientsCount = ref(0)
  
  // Activity data
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
      
      // Update activity data from audit logs
      activity.value = auditLogs.value || []
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
      console.error('Error fetching edges count:', error)
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
      console.error('Error fetching locations count:', error)
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
      console.error('Error fetching things count:', error)
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
      console.error('Error fetching clients count:', error)
      // Keep existing value on error
    }
  }
  
  /**
   * Fetch recent activity from audit logs
   */
  const fetchRecentActivity = async () => {
    try {
      await loadRecentLogs({ limit: 10 })
      // The auditLogs ref will be updated by the loadRecentLogs function
    } catch (error) {
      console.error('Error fetching recent activity:', error)
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
    openGrafana
  }
}
