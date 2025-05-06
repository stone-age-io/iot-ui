// src/composables/useDashboard.js
import { ref, computed } from 'vue'
import { edgeService, locationService, thingService, clientService } from '../services/index'
import { useAuditLogs } from './useAuditLogs'
import { useApiOperation } from './useApiOperation'
import { useReactiveData } from './useReactiveData'
import configService from '../services/config/configService'

/**
 * Composable for dashboard functionality
 * Enhanced to properly utilize the reactive caching system
 * @returns {Object} - Dashboard state and methods
 */
export function useDashboard() {
  // Activity data - this is a ref that will hold the array of activities
  const activity = ref([])
  
  // Use the audit logs composable for activity data
  const { auditLogs, loading: auditLoading, loadRecentLogs } = useAuditLogs()
  
  // Use reactive data for edge count with proper caching
  const edgesCountData = useReactiveData({
    collection: 'edges',
    operation: 'count',
    fetchFunction: fetchEdgesCountRaw,
    processData: data => data?.totalItems || 0
  })
  
  // Use reactive data for location count with proper caching
  const locationsCountData = useReactiveData({
    collection: 'locations',
    operation: 'count',
    fetchFunction: fetchLocationsCountRaw,
    processData: data => data?.totalItems || 0
  })
  
  // Use reactive data for thing count with proper caching
  const thingsCountData = useReactiveData({
    collection: 'things',
    operation: 'count',
    fetchFunction: fetchThingsCountRaw,
    processData: data => data?.totalItems || 0
  })
  
  // Use reactive data for client count with proper caching
  const clientsCountData = useReactiveData({
    collection: 'clients',
    operation: 'count',
    fetchFunction: fetchClientsCountRaw,
    processData: data => data?.totalItems || 0
  })
  
  // Expose computed properties for the count values
  const edgesCount = computed(() => edgesCountData.data.value || 0)
  const locationsCount = computed(() => locationsCountData.data.value || 0)
  const thingsCount = computed(() => thingsCountData.data.value || 0)
  const clientsCount = computed(() => clientsCountData.data.value || 0)
  
  // Compute overall loading state from all data sources
  const loading = computed(() => 
    edgesCountData.loading.value || 
    locationsCountData.loading.value || 
    thingsCountData.loading.value || 
    clientsCountData.loading.value ||
    auditLoading.value
  )
  
  /**
   * Raw function to fetch edges count - used by useReactiveData
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Raw response
   */
  async function fetchEdgesCountRaw(options = {}) {
    return await edgeService.getList({ 
      rows: 1,
      ...options
    })
  }
  
  /**
   * Raw function to fetch locations count - used by useReactiveData
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Raw response
   */
  async function fetchLocationsCountRaw(options = {}) {
    return await locationService.getList({ 
      rows: 1,
      ...options
    })
  }
  
  /**
   * Raw function to fetch things count - used by useReactiveData
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Raw response
   */
  async function fetchThingsCountRaw(options = {}) {
    return await thingService.getList({ 
      rows: 1,
      ...options
    })
  }
  
  /**
   * Raw function to fetch clients count - used by useReactiveData
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Raw response
   */
  async function fetchClientsCountRaw(options = {}) {
    return await clientService.getList({ 
      rows: 1,
      ...options
    })
  }
  
  /**
   * Fetch all dashboard data
   * This will update all reactive data sources and the activity feed
   * @param {boolean} skipCache - Whether to force refresh from API
   * @returns {Promise<void>}
   */
  const fetchDashboardData = async (skipCache = false) => {
    try {
      // Refresh all reactive data in parallel
      await Promise.all([
        edgesCountData.refreshData(skipCache),
        locationsCountData.refreshData(skipCache),
        thingsCountData.refreshData(skipCache),
        clientsCountData.refreshData(skipCache),
        fetchRecentActivity()
      ])
      
      // Copy the audit logs to our activity ref for component access
      activity.value = [...auditLogs.value]
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }
  
  /**
   * Fetch recent activity from audit logs
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Formatted activity items
   */
  const fetchRecentActivity = async (options = {}) => {
    try {
      // Use skipFiltering option to get more inclusive results
      const logs = await loadRecentLogs({ 
        limit: 15,
        skipFiltering: true,
        ...options
      })
      
      // Update the activity ref
      activity.value = logs || []
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
    // State - expose the computed values for component access
    edgesCount,
    locationsCount,
    thingsCount,
    clientsCount,
    activity,
    loading,
    
    // Methods
    fetchDashboardData,
    fetchRecentActivity,
    openGrafana
  }
}
