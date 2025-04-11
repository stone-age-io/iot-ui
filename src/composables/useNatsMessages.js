// src/composables/useNatsMessages.js
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import natsService from '../services/nats/natsService'
import { natsConfigService } from '../services/nats/natsConfigService'

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
  
  // Get saved topics from config
  const loadTopics = () => {
    const config = natsConfigService.getConfig()
    topics.value = config.subjects || []
  }
  
  // Subscribe to a topic
  const subscribe = async (topic) => {
    // Skip if already subscribed
    if (subscriptions.value[topic]) {
      console.log(`Already subscribed to topic: ${topic}, skipping.`)
      return subscriptions.value[topic]
    }
    
    // Skip if NATS is not connected
    if (!natsService.isConnected()) {
      error.value = 'Cannot subscribe: NATS is not connected'
      toast.add({
        severity: 'error',
        summary: 'Subscription Error',
        detail: 'Cannot subscribe: NATS is not connected',
        life: 3000
      })
      return null
    }
    
    try {
      console.log(`Subscribing to topic: ${topic}`)
      
      // Subscribe to the topic
      const subscription = await natsService.subscribe(topic, (message, subject, subscriptionId) => {
        // Skip if paused
        if (paused.value) return
        
        // Skip if this subscription ID is not in our active set
        if (!activeSubscriptionIds.value.has(subscriptionId)) {
          console.log(`Ignoring message from inactive subscription: ${subscriptionId}`)
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
          console.log(`Added subscription ID ${subscription.sid} to active set`)
        }
        
        console.log(`Successfully subscribed to topic: ${topic}`)
      }
      
      return subscription
    } catch (err) {
      console.error('Error subscribing to topic:', err)
      error.value = `Failed to subscribe to topic: ${topic}`
      toast.add({
        severity: 'error',
        summary: 'Subscription Error',
        detail: `Failed to subscribe to topic: ${topic}`,
        life: 3000
      })
      return null
    }
  }
  
  // Unsubscribe from a topic
  const unsubscribe = async (topic) => {
    const subscription = subscriptions.value[topic]
    if (subscription) {
      try {
        // Remove from active subscription IDs
        if (subscription.sid) {
          activeSubscriptionIds.value.delete(subscription.sid)
          console.log(`Removed subscription ID ${subscription.sid} from active set`)
        }
        
        // Perform NATS unsubscribe
        await natsService.unsubscribe(subscription)
        
        // Remove from subscriptions
        delete subscriptions.value[topic]
        console.log(`Unsubscribed from topic: ${topic}`)
      } catch (err) {
        console.error('Error unsubscribing from topic:', err)
      }
    }
  }
  
  // Subscribe to all configured topics
  const subscribeToAllTopics = async () => {
    console.log("Starting subscribeToAllTopics")
    
    // Don't set loading if we already have active subscriptions
    const hasActiveSubscriptions = Object.keys(subscriptions.value).length > 0
    if (!hasActiveSubscriptions) {
      loading.value = true
    }
    
    try {
      // Load topics from config
      loadTopics()
      
      // If we have topics but no active subscriptions, clear the messages to start fresh
      if (topics.value.length > 0 && !hasActiveSubscriptions) {
        messages.value = []
      }
      
      // Subscribe to each topic
      for (const topic of topics.value) {
        await subscribe(topic)
      }
    } finally {
      loading.value = false
    }
    
    console.log("Completed subscribeToAllTopics")
  }
  
  // Unsubscribe from all topics
  const unsubscribeFromAllTopics = async () => {
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
      console.log("Cleared all active subscription IDs")
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
  
  // Clean up when unmounted
  onUnmounted(() => {
    // Unsubscribe from all topics
    unsubscribeFromAllTopics()
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
    prevPage
  }
}
