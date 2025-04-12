// src/composables/useMessages.js
import { ref } from 'vue'
import dayjs from 'dayjs'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for handling device messages and status
 * Creates mock data for demo purposes - this would be replaced with real API calls in production
 */
export function useMessages() {
  const { performOperation } = useApiOperation()
  
  // Mock device status data
  const deviceStatus = ref({
    online: true,
    lastUpdated: new Date(),
    metrics: {
      batteryLevel: 85,
      signalStrength: -67,
      firmwareVersion: '1.2.3',
      temperature: 36.5
    }
  })
  
  // Mock messages
  const messages = ref([])
  const hasMoreMessages = ref(true)
  const loading = ref(false)
  
  /**
   * Format time for display
   * @param {Date} dateObj - Date object
   * @returns {string} - Formatted time
   */
  const formatTime = (dateObj) => {
    if (!dateObj) return 'N/A'
    return dayjs(dateObj).format('HH:mm:ss')
  }
  
  /**
   * Generate mock messages based on device type
   * @param {string} thingType - Type of thing
   * @param {string} thingId - Thing ID
   */
  const loadMessages = async (thingType) => {
    return performOperation(
      async () => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Generate mock messages based on thing type
        const mockMessages = []
        
        if (thingType === 'reader') {
          mockMessages.push({
            type: 'access.entry.granted',
            timestamp: new Date(Date.now() - 5 * 60000),
            summary: 'Access granted to user #1234',
            expanded: false,
            payload: {
              credential_type: 'card',
              credential_id: '0123456789',
              user_id: '018e7507-c547-7f43-9485-71c71b3b0448',
              direction: 'in'
            }
          })
          mockMessages.push({
            type: 'access.entry.denied',
            timestamp: new Date(Date.now() - 15 * 60000),
            summary: 'Access denied to unknown card',
            expanded: false,
            payload: {
              credential_type: 'card',
              credential_id: '9876543210',
              reason: 'unknown_card',
              direction: 'in'
            }
          })
        } else if (thingType === 'temperature-sensor') {
          mockMessages.push({
            type: 'environment.temperature',
            timestamp: new Date(Date.now() - 2 * 60000),
            summary: 'Temperature reading: 23.5°C',
            expanded: false,
            payload: {
              value: 23.5,
              unit: 'celsius',
              accuracy: 0.1
            }
          })
          mockMessages.push({
            type: 'environment.temperature',
            timestamp: new Date(Date.now() - 12 * 60000),
            summary: 'Temperature reading: 23.8°C',
            expanded: false,
            payload: {
              value: 23.8,
              unit: 'celsius',
              accuracy: 0.1
            }
          })
        } else {
          mockMessages.push({
            type: 'device.status.online',
            timestamp: new Date(Date.now() - 30 * 60000),
            summary: 'Device came online',
            expanded: false,
            payload: {
              uptime: 0,
              firmware_version: '1.2.3'
            }
          })
        }
        
        // Add a common status message for all devices
        mockMessages.push({
          type: 'device.status.heartbeat',
          timestamp: new Date(Date.now() - 1 * 60000),
          summary: 'Regular device heartbeat',
          expanded: false,
          payload: {
            uptime: 3600,
            memory_usage: 24.5,
            cpu_usage: 2.3
          }
        })
        
        // Set random online status for demo
        deviceStatus.value.online = Math.random() > 0.2
        deviceStatus.value.lastUpdated = new Date()
        
        return mockMessages
      },
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: `Failed to load messages`,
        onSuccess: (mockMessages) => {
          messages.value = mockMessages
          hasMoreMessages.value = true
          return messages.value
        }
      }
    )
  }
  
  /**
   * Load more messages (mock implementation)
   */
  const loadMoreMessages = async () => {
    return performOperation(
      async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Return a new message
        return {
          type: 'device.status.heartbeat',
          timestamp: new Date(Date.now() - (messages.value.length + 1) * 60000),
          summary: 'Regular device heartbeat',
          expanded: false,
          payload: {
            uptime: 3000,
            memory_usage: 23.1,
            cpu_usage: 1.9
          }
        }
      },
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: 'Failed to load more messages',
        onSuccess: (newMessage) => {
          // Add one more message
          messages.value.push(newMessage)
          
          // After a few loads, indicate no more messages
          if (messages.value.length > 5) {
            hasMoreMessages.value = false
          }
          
          return messages.value
        }
      }
    )
  }
  
  /**
   * Toggle message expanded state
   * @param {number} index - Index of message to toggle
   */
  const toggleMessageDetails = (index) => {
    if (index >= 0 && index < messages.value.length) {
      messages.value[index].expanded = !messages.value[index].expanded
    }
  }
  
  return {
    deviceStatus,
    messages,
    hasMoreMessages,
    loading,
    formatTime,
    loadMessages,
    loadMoreMessages,
    toggleMessageDetails
  }
}
