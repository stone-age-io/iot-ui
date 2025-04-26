// src/composables/useAuditLogs.js
import { ref } from 'vue'
import { auditLogService } from '../services/audit/auditLogService'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for working with audit logs
 * Enhanced implementation with improved filtering options
 * @returns {Object} - Audit logs state and methods
 */
export function useAuditLogs() {
  // State for audit logs
  const auditLogs = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Use API operation composable for consistent handling
  const { performOperation } = useApiOperation()
  
  /**
   * Load recent audit logs
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of logs to return
   * @param {string} options.collection - Filter by collection name (optional)
   * @param {Array<string>} options.eventTypes - Filter by event types (optional)
   * @param {boolean} options.skipFiltering - Skip the default event type filtering (optional)
   * @returns {Promise<Array>} - Formatted audit logs
   */
  const loadRecentLogs = async (options = {}) => {
    return performOperation(
      async () => {
        console.log('Loading audit logs with options:', options)
        
        // Get raw logs from service
        const rawLogs = await auditLogService.getRecentActivity({
          limit: options.limit || 10,
          sortBy: 'timestamp',
          sortDirection: 'desc'
        })
        
        console.log('Raw audit logs fetched:', rawLogs?.length || 0, 'items')
        
        // Start with all logs
        let filteredLogs = rawLogs || []
        
        // Filter logs based on options
        if (options.eventTypes && options.eventTypes.length > 0) {
          // Use provided event types filter if specified
          console.log('Filtering by specified event types:', options.eventTypes)
          filteredLogs = filteredLogs.filter(log => 
            options.eventTypes.includes(log.event_type)
          )
        } else if (!options.skipFiltering) {
          // Default filter for *_request event types, but allow skipping
          console.log('Applying default event type filter for *_request')
          filteredLogs = filteredLogs.filter(log => 
            log.event_type && log.event_type.endsWith('_request')
          )
        } else {
          console.log('Skipping event type filtering')
        }
        
        // Filter by collection if specified
        if (options.collection) {
          console.log('Filtering by collection:', options.collection)
          filteredLogs = filteredLogs.filter(log => 
            log.collection_name === options.collection
          )
        }
        
        console.log('Filtered logs count:', filteredLogs.length)
        
        // Format logs for display
        const formattedLogs = filteredLogs.map(log => 
          auditLogService.formatLogForDisplay(log)
        )
        
        console.log('Formatted logs for display:', formattedLogs.length, 'items')
        
        // Update the auditLogs ref
        auditLogs.value = formattedLogs
        return formattedLogs
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load audit logs'
      }
    )
  }
  
  /**
   * Get audit logs for a specific record
   * @param {string} collection - Collection name
   * @param {string} recordId - Record ID
   * @param {boolean} requestEventsOnly - Whether to only include *_request events
   * @returns {Promise<Array>} - Formatted audit logs for record
   */
  const getRecordHistory = async (collection, recordId, requestEventsOnly = true) => {
    return performOperation(
      async () => {
        // Get all logs from service
        const rawLogs = await auditLogService.getRecentActivity({
          limit: 100, // Get more logs for comprehensive history
          sortBy: 'timestamp',
          sortDirection: 'desc'
        })
        
        // Filter logs by collection and record ID
        let recordLogs = rawLogs.filter(log => 
          log.collection_name === collection && log.record_id === recordId
        )
        
        // Filter for request events only if specified
        if (requestEventsOnly) {
          recordLogs = recordLogs.filter(log => 
            log.event_type && log.event_type.endsWith('_request')
          )
        }
        
        // Format logs for display
        return recordLogs.map(log => 
          auditLogService.formatLogForDisplay(log)
        )
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: `Failed to load history for ${collection}`
      }
    )
  }
  
  return {
    // State
    auditLogs,
    loading,
    error,
    
    // Methods
    loadRecentLogs,
    getRecordHistory
  }
}
