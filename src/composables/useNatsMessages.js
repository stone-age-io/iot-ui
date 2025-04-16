// src/composables/useNatsMessages.js
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import natsService from '../services/nats/natsService'
import { natsConfigService } from '../services/nats/natsConfigService'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for managing NATS messages subscriptions and display
 * Provides functionality to subscribe to topics, manage received messages,
 * and control message flow (pause/resume)
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
          
          // Add message to list
          addMessage({
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
  
  // Add a message to the list
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
  
  // Computed for paginated messages
  const paginatedMessages = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return messages.value.slice(start, end)
  })
  
  // Computed for total pages
  const totalPages = computed(() => {
    return Math.ceil(messages.value.length / pageSize.value) || 1
  })
  
  // Go to specific page
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  // Go to next page
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
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
  
  // Watch for changes in messages and update current page if needed
  watch(messages, () => {
    // If we're on a page that no longer exists, go to the last page
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value
    }
    
    // If we're not paused and new messages arrive, go to first page to show them
    if (!paused.value && messages.value.length > 0) {
      currentPage.value = 1
    }
  })
  
  // Setup on mount
  onMounted(() => {
    // Register connection status listener
    natsService.onStatusChange(connectionListener)
    
    // Try to subscribe if already connected
    if (natsService.isConnected()) {
      subscribeToAllTopics()
    }
    
    // Debug - Check if we have topics configured
    loadTopics()
  })
  
  // Clean up when unmounted
  onUnmounted(() => {
    // Remove connection listener
    natsService.removeStatusListener(connectionListener)
    
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
    formatTimestamp,
    goToPage,
    nextPage,
    prevPage,
    reset
  }
}
