// src/composables/useNatsMessages.js
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import natsService from '../services/nats/natsService'
import { natsConfigService } from '../services/nats/natsConfigService'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for managing NATS messages subscriptions and display
 * Improved to better handle pagination and UI updates
 * 
 * @param {number} maxMessages - Maximum number of messages to store
 * @returns {Object} - Messages state and methods
 */
export function useNatsMessages(maxMessages = 100) {
  const toast = useToast()
  const { performOperation } = useApiOperation()
  
  // State
  const messages = ref([])
  const paused = ref(false)
  const subscriptions = ref({})
  const topics = ref([])
  const currentPage = ref(1)
  const pageSize = ref(5) // Default to 5 messages per page
  const loading = ref(false)
  const error = ref(null)
  const activeSubscriptionIds = ref(new Set()) // Track active subscription IDs
  const isSubscribed = ref(false) // Flag to track if subscriptions are active
  const connectionReady = ref(natsService.isConnected()) // Track connection state
  const isUpdating = ref(false) // Flag to prevent multiple concurrent updates
  
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
  
  // Subscribe to a topic
  const subscribe = async (topic) => {
    // Skip if already subscribed to this topic
    if (subscriptions.value[topic]) {
      return subscriptions.value[topic]
    }
    
    // Skip if NATS is not connected
    if (!natsService.isConnected()) {
      error.value = 'Cannot subscribe: NATS is not connected'
      return null
    }
    
    return performOperation(
      async () => {
        // Subscribe to the topic
        const subscription = await natsService.subscribe(topic, (message, subject, subscriptionId) => {
          // Skip if paused
          if (paused.value) return
          
          // Skip if this subscription ID is not in our active set
          if (!activeSubscriptionIds.value.has(subscriptionId)) {
            return
          }
          
          // Add message to list with debounced updates
          addMessageWithDebounce({
            id: generateMessageId(),
            topic: subject,
            data: message,
            timestamp: new Date()
          })
        })
        
        if (subscription) {
          // Store subscription
          subscriptions.value[topic] = subscription
          
          // Add subscription ID to active set
          if (subscription.sid) {
            activeSubscriptionIds.value.add(subscription.sid)
          }
        }
        
        return subscription
      },
      {
        loadingRef: false,
        errorRef: error,
        errorMessage: `Failed to subscribe to topic: ${topic}`,
        onSuccess: (subscription) => subscription,
        onError: () => null
      }
    )
  }
  
  // Unsubscribe from a topic
  const unsubscribe = async (topic) => {
    const subscription = subscriptions.value[topic]
    if (subscription) {
      return performOperation(
        async () => {
          // Remove from active subscription IDs
          if (subscription.sid) {
            activeSubscriptionIds.value.delete(subscription.sid)
          }
          
          // Perform NATS unsubscribe
          await natsService.unsubscribe(subscription)
          
          // Remove from subscriptions
          delete subscriptions.value[topic]
          
          return true
        },
        {
          loadingRef: false,
          errorRef: error,
          errorMessage: `Error unsubscribing from topic: ${topic}`,
          onSuccess: () => true,
          onError: () => false
        }
      )
    }
    return Promise.resolve(true)
  }
  
  // Subscribe to all configured topics
  const subscribeToAllTopics = async () => {
    // Prevent duplicate subscriptions by checking if already subscribed
    if (isSubscribed.value) {
      return
    }
    
    // Don't set loading if we already have active subscriptions
    const hasActiveSubscriptions = Object.keys(subscriptions.value).length > 0
    if (!hasActiveSubscriptions) {
      loading.value = true
    }
    
    try {
      // Load topics from config
      const configTopics = loadTopics()
      
      // If we have topics but no active subscriptions, clear the messages to start fresh
      if (configTopics.length > 0 && !hasActiveSubscriptions) {
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
      
      if (successCount > 0) {
        return true
      } else {
        return false
      }
    } finally {
      loading.value = false
    }
  }
  
  // Unsubscribe from all topics
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
      
      // Clear active subscription IDs
      activeSubscriptionIds.value.clear()
      
      // Reset subscription flag
      isSubscribed.value = false
    } finally {
      loading.value = false
    }
  }
  
  // Toggle pause/resume
  const togglePause = () => {
    paused.value = !paused.value
    
    toast.add({
      severity: 'info',
      summary: paused.value ? 'Paused' : 'Resumed',
      detail: paused.value ? 'Message stream paused' : 'Message stream resumed',
      life: 2000
    })
  }
  
  // Debounce timer for batch updates
  let addMessageTimer = null
  const pendingMessages = []
  
  // Add a message to the list with debouncing
  const addMessageWithDebounce = (message) => {
    // Add to pending messages
    pendingMessages.push(message)
    
    // Clear existing timer
    if (addMessageTimer) {
      clearTimeout(addMessageTimer)
    }
    
    // Set new timer to batch updates
    addMessageTimer = setTimeout(() => {
      // Process all pending messages
      if (pendingMessages.length > 0) {
        // Avoid processing if already updating
        if (isUpdating.value) return
        
        isUpdating.value = true
        
        // Add all pending messages in a single update
        const messagesToAdd = [...pendingMessages]
        pendingMessages.length = 0 // Clear pending messages
        
        // Batch add messages to minimize reactivity triggers
        nextTick(() => {
          // Add in correct order (newest first)
          messages.value = [...messagesToAdd.reverse(), ...messages.value]
          
          // Limit the number of messages
          if (messages.value.length > maxMessages) {
            messages.value = messages.value.slice(0, maxMessages)
          }
          
          // Important: Only update page if on first page and not paused
          // This prevents unwanted page shifts when viewing older messages
          if (currentPage.value === 1 && !paused.value) {
            refreshPaginatedMessages()
          }
          
          isUpdating.value = false
        })
      }
    }, 100) // 100ms debounce
  }
  
  // Add a single message to the list (non-debounced version)
  const addMessage = (message) => {
    // Add to beginning of array (newest first)
    messages.value.unshift(message)
    
    // Limit the number of messages
    if (messages.value.length > maxMessages) {
      messages.value = messages.value.slice(0, maxMessages)
    }
  }
  
  // Generate a unique message ID
  const generateMessageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  // Clear all messages
  const clearMessages = () => {
    messages.value = []
    currentPage.value = 1
    
    toast.add({
      severity: 'info',
      summary: 'Cleared',
      detail: 'All messages cleared',
      life: 2000
    })
  }
  
  // Format message data for display
  const formatMessageData = (data) => {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2)
    }
    return String(data)
  }
  
  /**
   * Creates a minimized representation of message data
   * Optimized for compact display while preserving key information
   * 
   * @param {any} data - Message data to extract payload from
   * @param {number} maxLength - Maximum length for truncated output
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
  
  // Generate human-readable timestamp
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
  
  // Computed for paginated messages with memoization
  const paginatedMessagesCache = ref(null)
  const currentPaginationKey = ref('')
  
  // Helper to refresh paginated messages
  const refreshPaginatedMessages = () => {
    const key = `${currentPage.value}-${pageSize.value}-${messages.value.length}`
    
    // Only recalculate if needed
    if (key !== currentPaginationKey.value || !paginatedMessagesCache.value) {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      paginatedMessagesCache.value = messages.value.slice(start, end)
      currentPaginationKey.value = key
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
  
  // Go to specific page with smooth transitions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      // Save current value for transition comparison
      const oldPage = currentPage.value
      
      // Set new page
      currentPage.value = page
      
      // Clear cache to force recalculation
      currentPaginationKey.value = ''
      
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
    // Don't reset subscriptions here as they'll be handled by unsubscribeFromAllTopics
  }
  
  // Attempt to subscribe if connection becomes available
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
      // Use nextTick to prevent issues with cascading updates
      nextTick(() => {
        currentPage.value = totalPages.value
        
        // Clear cache to force recalculation
        currentPaginationKey.value = ''
      })
    }
  })
  
  // Watch for page size changes
  watch(pageSize, () => {
    // Clear cache to force recalculation
    currentPaginationKey.value = ''
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
    if (addMessageTimer) {
      clearTimeout(addMessageTimer)
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
