// src/services/audit/auditLogService.js
import { BaseService } from '../base/BaseService'
import { collectionEndpoint } from '../pocketbase-config'
import configService from '../config/configService'

/**
 * Service for interacting with the audit_logs collection
 */
class AuditLogService extends BaseService {
  constructor() {
    // Add audit_logs to the collections
    configService.collections.AUDIT_LOGS = 'audit_logs'
    
    super(
      configService.collections.AUDIT_LOGS,
      collectionEndpoint,
      {
        // Specify that changes fields are JSON fields
        jsonFields: ['before_changes', 'after_changes'],
        // Define fields to expand in queries
        expandFields: ['user_id'],
        // No field mappings needed for now
        fieldMappings: {}
      }
    )
  }

  /**
   * Get recent activity logs
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of logs to return
   * @param {string} options.sortBy - Field to sort by (default: 'timestamp')
   * @param {string} options.sortDirection - Sort direction ('asc' or 'desc', default: 'desc')
   * @returns {Promise<Array>} - Recent activity logs
   */
  async getRecentActivity(options = {}) {
    const {
      limit = 10,
      sortBy = 'timestamp',
      sortDirection = 'desc'
    } = options

    // Build parameters for the API request
    const params = {
      page: 1,
      rows: limit,
      sort: `${sortDirection === 'desc' ? '-' : ''}${sortBy}`
    }

    try {
      const { data } = await this.getList(params)
      return data.items || []
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }
  }

  /**
   * Format audit log for display in the UI
   * @param {Object} log - Raw audit log from the API
   * @returns {Object} - Formatted audit log for UI
   */
  formatLogForDisplay(log) {
    // Map event type to UI display type
    const typeMap = {
      'create_request': 'create',
      'update_request': 'update',
      'delete_request': 'delete',
      'auth': 'login'
    }

    // Format the timestamp
    const date = new Date(log.timestamp)
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)

    // Determine the user information
    const userName = log.expand?.user_id?.name || log.user_id || 'System'

    // Format collection name for display
    const collectionSingular = log.collection_name.replace(/_/g, ' ')
      // Singularize by removing trailing 's' if present
      .replace(/s$/, '')
      // Capitalize first letter of each word
      .replace(/\b\w/g, char => char.toUpperCase())

    // Construct a title based on the event type and collection
    let title = ''
    
    switch (log.event_type) {
      case 'auth':
        title = `${userName} logged in`
        break
      case 'create_request':
        title = `${userName} created a ${collectionSingular}`
        break
      case 'update_request':
        title = `${userName} updated a ${collectionSingular}`
        break
      case 'delete_request':
        title = `${userName} deleted a ${collectionSingular}`
        break
      default:
        title = `${userName} performed action on ${log.collection_name}`
    }

    // Get changes information
    let changesInfo = null
    if (log.before_changes || log.after_changes) {
      changesInfo = {
        before: log.before_changes,
        after: log.after_changes
      }
    }

    return {
      id: log.id,
      type: typeMap[log.event_type] || 'info',
      title: title,
      timestamp: formattedDate,
      user: userName,
      details: {
        collection: log.collection_name,
        recordId: log.record_id,
        method: log.request_method,
        url: log.request_url,
        changes: changesInfo,
        eventType: log.event_type
      }
    }
  }
}

export const auditLogService = new AuditLogService()
