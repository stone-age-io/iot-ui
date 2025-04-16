// src/composables/useAuditLogs.js
import { ref, computed } from 'vue'
import { auditLogService } from '../services/audit/auditLogService'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for working with audit logs
 * @returns {Object} - Audit logs state and methods
 */
export function useAuditLogs() {
  // State
  const auditLogs = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Use API operation composable for consistent handling
  const { performOperation } = useApiOperation()
  
  /**
   * Load recent audit logs with pagination support
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of logs to return
   * @param {string} options.collection - Filter by collection name (optional)
   * @param {Array<string>} options.eventTypes - Filter by event types (optional)
   * @returns {Promise<Array>} - Formatted audit logs
   */
  const loadRecentLogs = async (options = {}) => {
    return performOperation(
      async () => {
        // Get raw logs from service
        const rawLogs = await auditLogService.getRecentActivity({
          limit: options.limit || 10,
          sortBy: 'timestamp',
          sortDirection: 'desc'
        })
        
        // Filter logs to only include *_request types by default
        // unless specific event types are provided
        let filteredLogs = rawLogs
        
        if (options.eventTypes && options.eventTypes.length > 0) {
          // Use provided event types filter if specified
          filteredLogs = filteredLogs.filter(log => 
            options.eventTypes.includes(log.event_type)
          )
        } else {
          // Default filter for *_request event types
          filteredLogs = filteredLogs.filter(log => 
            log.event_type.endsWith('_request')
          )
        }
        
        // Filter by collection if specified
        if (options.collection) {
          filteredLogs = filteredLogs.filter(log => 
            log.collection_name === options.collection
          )
        }
        
        // Format logs for display
        const formattedLogs = filteredLogs.map(log => 
          auditLogService.formatLogForDisplay(log)
        )
        
        // Update state
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
          recordLogs = recordLogs.filter(log => log.event_type.endsWith('_request'))
        }
        
        // Format logs for display
        const formattedLogs = recordLogs.map(log => 
          auditLogService.formatLogForDisplay(log)
        )
        
        return formattedLogs
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: `Failed to load history for ${collection}`
      }
    )
  }
  
  // Computed properties
  const hasLogs = computed(() => auditLogs.value.length > 0)
  
  return {
    // State
    auditLogs,
    loading,
    error,
    hasLogs,
    
    // Methods
    loadRecentLogs,
    getRecordHistory
  }
}
