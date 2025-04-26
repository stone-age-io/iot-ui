// src/composables/useNatsMessages.js
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import natsService from '../services/nats/natsService'
import { natsConfigService } from '../services/nats/natsConfigService'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for managing NATS messages subscriptions and display
 * Simplified implementation for more reliable message handling
 * 
 * @param {number} maxMessages - Maximum number of messages to store
 * @returns {Object} - Messages state and methods
 */
export function useNatsMessages(maxMessages = 100) {
  const toast = useToast()
  const { performOperation } = useApiOperation()
  
  // Core state
  const messages = ref([])
  const paused = ref(false)
  const subscriptions = ref({})
  const topics = ref([])
  const currentPage = ref(1)
  const pageSize = ref(5) // Default to 5 messages per page
  const loading = ref(false)
  const error = ref(null)
  const isSubscribed = ref(false)
  const connectionReady = ref(natsService.isConnected())
  
  // Pagination state
  const paginatedMessagesCache = ref([])
  const lastRefreshKey = ref('')

  // Batching variables
  let messageQueue = []
  let processingTimer = null
  let isProcessing = false
  
  // Get saved topics from config
  const loadTopics = () => {
    const config = natsConfigService.getConfig()
    const configTopics = config.subjects || []
    
    // If no topics are configured, add a default topic for testing
    if (configTopics.length === 0) {
      configTopics.push('>')  // Subscribe to all messages
    }
    
    topics.value = configTopics
    return configTopics
  }
  
  /**
   * Process queued messages efficiently
   * Handles batching of messages and limiting the total count
   */
  const processMessageQueue = () => {
    if (messageQueue.length === 0 || isProcessing || paused.value) {
      return
    }
    
    isProcessing = true
    
    try {
      // Take all current messages from the queue
      const newMessages = [...messageQueue]
      messageQueue = [] // Clear the queue
      
      // Add new messages at the start (newest first)
      // and ensure we stay within the limit
      messages.value = [...newMessages.reverse(), ...messages.value].slice(0, maxMessages)
      
      // Only refresh pagination if we're on the first page
      // This prevents UI jumps when viewing historical data
      if (currentPage.value === 1 && !paused.value) {
        refreshPaginatedMessages(true)
      }
      
      // Debug count
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`NATS messages: ${messages.value.length}/${maxMessages}`)
      }
    } finally {
      isProcessing = false
      
      // Process any new messages that arrived while we were updating
      if (messageQueue.length > 0) {
        scheduleProcessing(0) // Process immediately
      }
    }
  }
  
  /**
   * Schedule message processing with intelligent timing
   * @param {number} delay - Delay in milliseconds
   */
  const scheduleProcessing = (delay = 100) => {
    if (processingTimer) {
      clearTimeout(processingTimer)
    }
    
    processingTimer = setTimeout(processMessageQueue, delay)
  }
  
  /**
   * Add a new message to the queue
   * @param {Object} message - Message to add
   */
  const queueMessage = (message) => {
    if (paused.value) return
    
    // Add message to queue
    messageQueue.push(message)
    
    // If we have lots of messages, process more frequently
    const quickProcessThreshold = 20
    const delay = messageQueue.length > quickProcessThreshold ? 0 : 100
    
    // Schedule processing
    scheduleProcessing(delay)
  }
  
  /**
   * Subscribe to a topic with simplified error handling
   * @param {string} topic - Topic to subscribe to
   * @returns {Object|null} - Subscription object or null
   */
  const subscribe = async (topic) => {
    // Skip if already subscribed
    if (subscriptions.value[topic]) {
      return subscriptions.value[topic]
    }
    
    // Skip if NATS is not connected
    if (!natsService.isConnected()) {
      error.value = 'Cannot subscribe: NATS is not connected'
      return null
    }
    
    try {
      // Subscribe to the topic
      const subscription = await natsService.subscribe(topic, (message, subject) => {
        // Queue message for processing
        queueMessage({
          id: generateMessageId(),
          topic: subject,
          data: message,
          timestamp: new Date()
        })
      })
      
      if (subscription) {
        // Store subscription
        subscriptions.value[topic] = subscription
        isSubscribed.value = true
        
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`Subscribed to ${topic}`)
        }
      }
      
      return subscription
    } catch (err) {
      console.error(`Failed to subscribe to ${topic}:`, err)
      error.value = `Failed to subscribe to topic: ${topic}`
      return null
    }
  }
  
  /**
   * Unsubscribe from a topic
   * @param {string} topic - Topic to unsubscribe from
   * @returns {Promise<boolean>} - Success status
   */
  const unsubscribe = async (topic) => {
    const subscription = subscriptions.value[topic]
    if (!subscription) return true
    
    try {
      // Perform NATS unsubscribe
      await natsService.unsubscribe(subscription)
      
      // Remove from subscriptions
      delete subscriptions.value[topic]
      
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`Unsubscribed from ${topic}`)
      }
      
      return true
    } catch (err) {
      console.error(`Error unsubscribing from ${topic}:`, err)
      error.value = `Error unsubscribing from topic: ${topic}`
      return false
    }
  }
  
  /**
   * Subscribe to all configured topics
   * @returns {Promise<boolean>} - Success status
   */
  const subscribeToAllTopics = async () => {
    if (isSubscribed.value && Object.keys(subscriptions.value).length > 0) {
      return true
    }
    
    loading.value = true
    
    try {
      // Load topics from config
      const configTopics = loadTopics()
      
      // Clear messages if subscribing for the first time
      if (configTopics.length > 0 && !isSubscribed.value) {
        messages.value = []
      }
      
      // Check if NATS is connected
      if (!natsService.isConnected()) {
        error.value = 'Cannot subscribe: NATS is not connected'
        return false
      }
      
      // Subscribe to each topic
      let successCount = 0
      for (const topic of configTopics) {
        const result = await subscribe(topic)
        if (result) successCount++
      }
      
      // Mark as subscribed if at least one subscription succeeded
      isSubscribed.value = successCount > 0
      
      return successCount > 0
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Unsubscribe from all topics
   * @returns {Promise<void>}
   */
  const unsubscribeFromAllTopics = async () => {
    if (!isSubscribed.value && Object.keys(subscriptions.value).length === 0) {
      return
    }
    
    loading.value = true
    
    try {
      // Get all subscribed topics
      const topicKeys = Object.keys(subscriptions.value)
      
      // Unsubscribe from each topic
      for (const topic of topicKeys) {
        await unsubscribe(topic)
      }
      
      // Reset subscription flag
      isSubscribed.value = false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Toggle pause/resume of message reception
   */
  const togglePause = () => {
    paused.value = !paused.value
    
    toast.add({
      severity: 'info',
      summary: paused.value ? 'Paused' : 'Resumed',
      detail: paused.value ? 'Message stream paused' : 'Message stream resumed',
      life: 2000
    })
  }
  
  /**
   * Generate a unique message ID
   * @returns {string} - Unique ID
   */
  const generateMessageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  /**
   * Clear all messages
   */
  const clearMessages = () => {
    messages.value = []
    currentPage.value = 1
    refreshPaginatedMessages(true)
    
    toast.add({
      severity: 'info',
      summary: 'Cleared',
      detail: 'All messages cleared',
      life: 2000
    })
  }
  
  /**
   * Format message data for display
   * @param {any} data - Message data
   * @returns {string} - Formatted data
   */
  const formatMessageData = (data) => {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2)
    }
    return String(data)
  }
  
  /**
   * Creates a minimized representation of message data
   * @param {any} data - Message data
   * @param {number} maxLength - Maximum length for output
   * @returns {string} - Formatted payload
   */
  const extractPayload = (data, maxLength = 150) => {
    if (!data) return "{}";
    
    try {
      // Parse if it's a string
      let parsed = data;
      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data);
        } catch {
          // If not valid JSON, return the string truncated
          return data.length > maxLength 
            ? data.substring(0, maxLength) + '...'
            : data;
        }
      }
      
      // Create a compact representation focusing on essential data
      const compactView = {};
      
      // Priority fields to extract (in order of importance)
      const priorityFields = ['type', 'event', 'action', 'command', 'status'];
      const dataFields = ['payload', 'data', 'message', 'content', 'body', 'value'];
      const metaFields = ['id', 'timestamp', 'ts', 'time', 'date', 'created'];
      
      // Extract type information (high priority)
      for (const field of priorityFields) {
        if (parsed[field] !== undefined) {
          compactView[field] = parsed[field];
          break; // Only get the first type field
        }
      }
      
      // Extract data content (second priority)
      for (const field of dataFields) {
        if (parsed[field] !== undefined) {
          const fieldValue = parsed[field];
          
          // Handle nested objects by simplifying them
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            // For arrays, show length and some items
            if (Array.isArray(fieldValue)) {
              compactView[field] = fieldValue.length > 3
                ? `[${fieldValue.slice(0, 2).map(val => JSON.stringify(val)).join(', ')}, ... (${fieldValue.length} items)]`
                : fieldValue;
            } else {
              // For objects, show a simplified version
              const keys = Object.keys(fieldValue);
              compactView[field] = keys.length > 3
                ? `{${keys.slice(0, 2).join(', ')}, ... (${keys.length} keys)}`
                : fieldValue;
            }
          } else {
            compactView[field] = fieldValue;
          }
          
          break; // Only include one data field
        }
      }
      
      // Add one meta field if available
      for (const field of metaFields) {
        if (parsed[field] !== undefined) {
          compactView[field] = parsed[field];
          break; // Only include one meta field
        }
      }
      
      // If we don't have any fields yet, show top-level structure
      if (Object.keys(compactView).length === 0) {
        if (Array.isArray(parsed)) {
          return `Array with ${parsed.length} items`;
        } else if (typeof parsed === 'object' && parsed !== null) {
          const keys = Object.keys(parsed);
          const preview = keys.length > 3
            ? `{${keys.slice(0, 3).join(', ')}, ...}`
            : JSON.stringify(parsed, null, 2);
          return preview;
        } else {
          return String(parsed);
        }
      }
      
      // Format the result - stringify with limits
      const result = JSON.stringify(compactView, null, 2);
      if (result.length > maxLength) {
        // Simple truncation for now
        return result.substring(0, maxLength) + '...';
      }
      
      return result;
    } catch (e) {
      console.error('Error processing message payload:', e);
      // Fallback to string representation
      if (typeof data === 'object') {
        try {
          const str = JSON.stringify(data);
          return str.length > maxLength 
            ? str.substring(0, maxLength) + '...' 
            : str;
        } catch {
          return String(data);
        }
      }
      return String(data);
    }
  };
  
  /**
   * Format timestamp for display
   * @param {Date|string} timestamp - Timestamp to format
   * @param {boolean} includeDate - Whether to include date
   * @returns {string} - Formatted timestamp
   */
  const formatTimestamp = (timestamp, includeDate = false) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    
    if (includeDate) {
      // Format with date for detail view
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      })
    }
    
    // Format time only for list view
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }
  
  /**
   * Refresh paginated messages with optional force
   * @param {boolean} force - Force refresh even if key hasn't changed
   * @returns {Array} - Paginated messages
   */
  const refreshPaginatedMessages = (force = false) => {
    const key = `${currentPage.value}-${pageSize.value}-${messages.value.length}`
    
    // Only recalculate if needed or forced
    if (force || key !== lastRefreshKey.value || paginatedMessagesCache.value.length === 0) {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      paginatedMessagesCache.value = messages.value.slice(start, end)
      lastRefreshKey.value = key
    }
    
    return paginatedMessagesCache.value
  }
  
  // Computed for paginated messages
  const paginatedMessages = computed(() => {
    return refreshPaginatedMessages()
  })
  
  // Computed for total pages
  const totalPages = computed(() => {
    return Math.ceil(messages.value.length / pageSize.value) || 1
  })
  
  /**
   * Go to a specific page
   * @param {number} page - Page number
   * @returns {boolean} - Success status
   */
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      refreshPaginatedMessages(true)
      return true
    }
    return false
  }
  
  // Go to next page
  const nextPage = () => {
    return goToPage(currentPage.value + 1)
  }
  
  // Go to previous page
  const prevPage = () => {
    return goToPage(currentPage.value - 1)
  }
  
  // Reset all state to initial values
  const reset = () => {
    messages.value = []
    paused.value = false
    currentPage.value = 1
    error.value = null
    isSubscribed.value = false
    refreshPaginatedMessages(true)
  }
  
  // Handle NATS connection status changes
  const connectionListener = (status) => {
    connectionReady.value = status === 'connected'
    
    // If connection becomes available and we're not subscribed yet, try to subscribe
    if (status === 'connected' && !isSubscribed.value) {
      subscribeToAllTopics()
    }
  }
  
  // Watch for changes in messages to handle pagination properly
  watch(() => messages.value.length, () => {
    // If we're on a page that no longer exists, go to the last page
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      nextTick(() => {
        currentPage.value = totalPages.value
        refreshPaginatedMessages(true)
      })
    }
  })
  
  // Watch for page size changes
  watch(pageSize, () => {
    refreshPaginatedMessages(true)
  })
  
  // Setup on mount
  onMounted(() => {
    // Register connection status listener
    natsService.onStatusChange(connectionListener)
    
    // Try to subscribe if already connected
    if (natsService.isConnected()) {
      subscribeToAllTopics()
    }
    
    // Load topics from config
    loadTopics()
  })
  
  // Clean up when unmounted
  onUnmounted(() => {
    // Remove connection listener
    natsService.removeStatusListener(connectionListener)
    
    // Clear any pending timers
    if (processingTimer) {
      clearTimeout(processingTimer)
    }
    
    // Unsubscribe from all topics and reset state
    unsubscribeFromAllTopics().then(() => {
      reset()
    })
  })
  
  return {
    // State
    messages,
    paginatedMessages,
    totalPages,
    currentPage,
    pageSize,
    paused,
    topics,
    loading,
    error,
    isSubscribed,
    connectionReady,
    
    // Methods
    subscribe,
    unsubscribe,
    subscribeToAllTopics,
    unsubscribeFromAllTopics,
    togglePause,
    clearMessages,
    formatMessageData,
    extractPayload,
    formatTimestamp,
    goToPage,
    nextPage,
    prevPage,
    reset
  }
}
