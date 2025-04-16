// src/composables/useDashboard.js
import { ref, reactive } from 'vue'
import { edgeService, locationService, thingService, clientService } from '../services/index'
import { useAuditLogs } from './useAuditLogs'
import configService from '../services/config/configService'

/**
 * Composable for dashboard functionality
 * @returns {Object} - Dashboard state and methods
 */
export function useDashboard() {
  // Entity counts
  const edgesCount = ref(0)
  const locationsCount = ref(0)
  const thingsCount = ref(0)
  const clientsCount = ref(0)
  
  // Recent activity
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

  // Load audit logs
  const { loadRecentLogs, loading: auditLoading } = useAuditLogs()
  
  /**
   * Fetch dashboard data
   * @returns {Promise<void>}
   */
  const fetchDashboardData = async () => {
    loading.value = true
    
    try {
      // Fetch entity counts in parallel
      const [edges, locations, things, clients, auditLogs] = await Promise.all([
        fetchEdgesCount(),
        fetchLocationsCount(),
        fetchThingsCount(),
        fetchClientsCount(),
        fetchRecentActivity()
      ])
      
      // Update state
      edgesCount.value = edges
      locationsCount.value = locations
      thingsCount.value = things
      clientsCount.value = clients
      activity.value = auditLogs
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch edges count
   * @returns {Promise<number>}
   */
  const fetchEdgesCount = async () => {
    try {
      const { data } = await edgeService.getList({ rows: 1 })
      return data.totalItems || 0
    } catch (error) {
      console.error('Error fetching edges count:', error)
      return 0
    }
  }
  
  /**
   * Fetch locations count
   * @returns {Promise<number>}
   */
  const fetchLocationsCount = async () => {
    try {
      const { data } = await locationService.getList({ rows: 1 })
      return data.totalItems || 0
    } catch (error) {
      console.error('Error fetching locations count:', error)
      return 0
    }
  }
  
  /**
   * Fetch things count
   * @returns {Promise<number>}
   */
  const fetchThingsCount = async () => {
    try {
      const { data } = await thingService.getList({ rows: 1 })
      return data.totalItems || 0
    } catch (error) {
      console.error('Error fetching things count:', error)
      return 0
    }
  }
  
  /**
   * Fetch clients count
   * @returns {Promise<number>}
   */
  const fetchClientsCount = async () => {
    try {
      const { data } = await clientService.getList({ rows: 1 })
      return data.totalItems || 0
    } catch (error) {
      console.error('Error fetching clients count:', error)
      return 0
    }
  }
  
  /**
   * Fetch recent activity from audit logs
   * @returns {Promise<Array>}
   */
  const fetchRecentActivity = async () => {
    try {
      // Use the new audit logs composable
      // Only load *_request event types (default behavior now in the composable)
      return await loadRecentLogs({
        limit: 10,
        // Request event types filter is handled by default in the composable now
      })
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
    loading,
    statusCounts,
    
    // Methods
    fetchDashboardData,
    openGrafana
  }
}
