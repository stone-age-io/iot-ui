// src/composables/usePubSub.js
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import natsService from '../services/nats/natsService'
import { useApiOperation } from './useApiOperation'
import { useEdge } from './useEdge'
import { useThing } from './useThing'
import { useOrganizationStore } from '../stores/organization'
import { generateUUIDv7 } from '../utils/uuidUtils'

// Local storage key for Pub/Sub configuration
const STORAGE_KEY = 'pubsub_config'

/**
 * Generate a standardized IoT message based on the IoT Messaging Standard v1.1
 * @param {string} thingId - UUID of the thing sending the message
 * @param {string} edgeId - UUID of the edge the thing belongs to
 * @param {string} messageType - Type of message in dot notation (e.g., "sensor.temperature.reading")
 * @param {object} payload - Event-specific data
 * @param {object} metadata - Optional thing health/state data
 * @param {object} context - Optional operational context
 * @param {number} version - Schema version
 * @returns {object} - Formatted message following the standard
 */
function generateStandardizedMessage(thingId, edgeId, messageType, payload = {}, metadata = {}, context = {}, version = 1) {
  // Generate timestamp with microsecond precision
  const now = new Date();
  const timestamp = now.toISOString().replace('Z', `${String(now.getMilliseconds()).padStart(3, '0')}Z`);
  
  return {
    id: generateUUIDv7(),
    ts: timestamp,
    thing_id: thingId || generateUUIDv7(), // Use provided ID or generate one
    edge_id: edgeId || generateUUIDv7(), // Use provided ID or generate one
    type: messageType,
    version,
    context,
    payload,
    metadata
  };
}

/**
 * Generate a NATS topic based on organization, edge, thing, and message type
 * Format: {org_id}.{edge_code}.{thing_type}.{thing_code}.{message_type}
 * 
 * @param {object} params - Topic parameters
 * @param {string} params.orgId - Organization ID/code
 * @param {string} params.edgeCode - Edge installation code (e.g., prd-eu-001)
 * @param {string} params.thingType - Thing category (e.g., sensor)
 * @param {string} params.thingCode - Thing identifier (e.g., sens-temp-001)
 * @param {string} params.messageType - Message category (e.g., telemetry)
 * @returns {string} - Formatted NATS topic
 */
function generateStandardTopic({ orgId, edgeCode, thingType, thingCode, messageType }) {
  return [orgId, edgeCode, thingType, thingCode, messageType].filter(Boolean).join('.');
}

/**
 * Parse a standard NATS topic into its components
 * @param {string} topic - NATS topic to parse
 * @returns {object} - Parsed components or null if invalid format
 */
function parseStandardTopic(topic) {
  if (!topic) return null;
  
  const parts = topic.split('.');
  if (parts.length !== 5) return null;
  
  return {
    orgId: parts[0],
    edgeCode: parts[1],
    thingType: parts[2],
    thingCode: parts[3],
    messageType: parts[4]
  };
}

/**
 * Composable for managing Pub/Sub functionality
 * Handles button configuration, layout, and NATS message publishing
 * 
 * @returns {Object} PubSub functionality
 */
export function usePubSub() {
  const toast = useToast()
  const { performOperation } = useApiOperation()
  const organizationStore = useOrganizationStore()
  const { edges, fetchEdges } = useEdge()
  const { things, fetchThings } = useThing()
  
  // State
  const buttons = ref([])
  const subscriptions = ref([])
  const layout = ref({
    columns: 3,
    gap: 4
  })
  const loading = ref(false)
  const error = ref(null)
  
  // Message templates
  const defaultMessageTemplates = [
    {
      id: 'sensor-reading',
      name: 'Sensor Reading',
      type: 'sensor.temperature.reading',
      payload: {
        value: 23.5,
        unit: 'celsius',
        accuracy: 0.1
      },
      metadata: {
        firmware_version: '1.2.3',
        battery_level: 85,
        signal_strength: -67
      }
    },
    {
      id: 'device-status',
      name: 'Device Status',
      type: 'device.status.online',
      payload: {
        status: 'online',
        uptime: 0,
        boot_time: new Date().toISOString()
      },
      metadata: {
        firmware_version: '2.1.0',
        hardware_version: 'B',
        network_type: 'ethernet'
      }
    },
    {
      id: 'access-event',
      name: 'Access Event',
      type: 'access.door.opened',
      payload: {
        user_id: generateUUIDv7(),
        method: 'card',
        credential_id: '0123456789'
      },
      metadata: {
        firmware_version: '1.5.2',
        battery_level: 92
      }
    }
  ]
  
  // Get organization code from store
  const organizationCode = computed(() => {
    return organizationStore.currentOrganizationCode || 'org';
  })
  
  // Load edges and things on initialization
  const initializeEntityData = async () => {
    try {
      await Promise.all([
        fetchEdges(),
        fetchThings()
      ]);
    } catch (err) {
      console.error('Error loading entity data for PubSub:', err);
    }
  }
  
  /**
   * Save the current configuration to localStorage
   */
  const saveConfig = () => {
    try {
      const config = {
        buttons: buttons.value,
        subscriptions: subscriptions.value,
        layout: layout.value,
        version: '1.0.0'
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      return true
    } catch (err) {
      console.error('Error saving PubSub configuration:', err)
      return false
    }
  }
  
  /**
   * Load configuration from localStorage
   */
  const loadConfig = () => {
    try {
      const storedConfig = localStorage.getItem(STORAGE_KEY)
      if (!storedConfig) return false
      
      const config = JSON.parse(storedConfig)
      
      // Update state with stored configuration
      buttons.value = config.buttons || []
      subscriptions.value = config.subscriptions || []
      
      // Handle layout configuration (with defaults for backwards compatibility)
      if (config.layout) {
        layout.value = {
          columns: config.layout.columns || 3,
          gap: config.layout.gap !== undefined ? config.layout.gap : 4
        }
      }
      
      return true
    } catch (err) {
      console.error('Error loading PubSub configuration:', err)
      return false
    }
  }
  
  /**
   * Generate a standardized message from button configuration
   * @param {Object} button - Button configuration
   * @returns {Object} - Standardized message
   */
  const generateMessageFromButton = (button) => {
    // Extract message components
    const thingId = button.thingId || generateUUIDv7();
    const edgeId = button.edgeId || generateUUIDv7();
    const messageType = button.messageType || 'custom.message.type';
    const payload = button.message?.payload || {};
    const metadata = button.message?.metadata || {};
    const context = button.message?.context || {};
    const version = button.message?.version || 1;
    
    return generateStandardizedMessage(
      thingId,
      edgeId,
      messageType,
      payload,
      metadata,
      context,
      version
    );
  }
  
  /**
   * Generate a topic string from button configuration
   * @param {Object} button - Button configuration
   * @returns {string} - Topic string
   */
  const generateTopicFromButton = (button) => {
    // If the topic is already set, use it
    if (button.topic) return button.topic;
    
    // Otherwise, build from components
    return generateStandardTopic({
      orgId: organizationCode.value,
      edgeCode: button.edgeCode,
      thingType: button.thingType,
      thingCode: button.thingCode,
      messageType: button.messageCategory || 'event'
    });
  }
  
  /**
   * Get available message templates
   * @returns {Array} - Message templates
   */
  const getMessageTemplates = () => {
    return defaultMessageTemplates;
  }
  
  /**
   * Add a new button to the configuration
   * @param {Object} button - Button configuration
   */
  const addButton = (button) => {
    const newButton = { ...button, id: button.id || Date.now().toString() }
    buttons.value.push(newButton)
    
    // If createSubscription flag is true, create a subscription for this topic
    if (newButton.createSubscription && newButton.topic) {
      addSubscription({
        id: `sub-${newButton.id}`,
        topic: newButton.topic,
        label: `${newButton.label} Subscription`,
        messageDisplay: {
          type: 'list',
          maxItems: 10
        }
      })
    }
    
    return newButton
  }
  
  /**
   * Update an existing button
   * @param {Object} button - Updated button configuration
   */
  const updateButton = (button) => {
    const index = buttons.value.findIndex(b => b.id === button.id)
    if (index === -1) return false
    
    buttons.value[index] = { ...button }
    
    return true
  }
  
  /**
   * Delete a button by ID
   * @param {string} id - Button ID
   */
  const deleteButton = (id) => {
    const index = buttons.value.findIndex(b => b.id === id)
    if (index === -1) return false
    
    // Also delete any associated subscriptions
    const associatedSubId = `sub-${id}`
    const subIndex = subscriptions.value.findIndex(s => s.id === associatedSubId)
    if (subIndex !== -1) {
      subscriptions.value.splice(subIndex, 1)
    }
    
    buttons.value.splice(index, 1)
    return true
  }
  
  /**
   * Add a new subscription
   * @param {Object} subscription - Subscription configuration
   */
  const addSubscription = (subscription) => {
    // Check for duplicate topics
    const existingIndex = subscriptions.value.findIndex(s => s.topic === subscription.topic)
    
    if (existingIndex !== -1) {
      // Update existing subscription instead of adding a duplicate
      subscriptions.value[existingIndex] = {
        ...subscriptions.value[existingIndex],
        ...subscription
      }
      return subscriptions.value[existingIndex]
    }
    
    // Add as a new subscription
    const newSubscription = { 
      ...subscription, 
      id: subscription.id || `sub-${Date.now().toString()}`
    }
    
    subscriptions.value.push(newSubscription)
    return newSubscription
  }
  
  /**
   * Delete a subscription by ID
   * @param {string} id - Subscription ID
   */
  const deleteSubscription = (id) => {
    const index = subscriptions.value.findIndex(s => s.id === id)
    if (index === -1) return false
    
    subscriptions.value.splice(index, 1)
    return true
  }
  
  /**
   * Publish a message to a NATS topic
   * @param {Object} button - Button configuration containing topic and message
   * @returns {Promise<boolean>} - Success status
   */
  const publishMessage = async (button) => {
    if (!button.topic) {
      toast.add({
        severity: 'error',
        summary: 'Publish Failed',
        detail: 'No topic specified for this button',
        life: 3000
      })
      return false
    }
    
    // Generate the standardized message
    const message = generateMessageFromButton(button);
    
    return performOperation(
      () => natsService.publish(button.topic, message),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: `Failed to publish message to ${button.topic}`,
        successMessage: `Message published to ${button.topic}`,
        onSuccess: () => true,
        onError: () => false
      }
    )
  }
  
  /**
   * Import configuration from JSON string
   * @param {string} configJson - Configuration JSON string
   * @returns {Object} - Imported configuration
   */
  const importConfiguration = (configJson) => {
    try {
      const config = JSON.parse(configJson)
      
      // Validate configuration
      if (!config.buttons || !Array.isArray(config.buttons)) {
        throw new Error('Invalid configuration: missing or invalid buttons array')
      }
      
      // Update state with imported configuration
      buttons.value = config.buttons
      subscriptions.value = config.subscriptions || []
      
      // Handle layout configuration (with defaults for backwards compatibility)
      if (config.layout) {
        layout.value = {
          columns: config.layout.columns || 3,
          gap: config.layout.gap !== undefined ? config.layout.gap : 4
        }
      }
      
      // Save the imported configuration
      saveConfig()
      
      return config
    } catch (err) {
      console.error('Error importing configuration:', err)
      throw new Error(`Failed to import configuration: ${err.message}`)
    }
  }
  
  /**
   * Export configuration as a JSON file download
   */
  const exportConfiguration = () => {
    try {
      const config = {
        buttons: buttons.value,
        subscriptions: subscriptions.value,
        layout: layout.value,
        version: '1.0.0',
        exportedAt: new Date().toISOString()
      }
      
      const configJson = JSON.stringify(config, null, 2)
      const blob = new Blob([configJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      // Create and click a download link
      const a = document.createElement('a')
      a.href = url
      a.download = `pubsub_config_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      
      return true
    } catch (err) {
      console.error('Error exporting configuration:', err)
      toast.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: err.message,
        life: 3000
      })
      return false
    }
  }
  
  // Initialize entity data when used
  initializeEntityData();
  
  return {
    // State
    buttons,
    subscriptions,
    layout,
    loading,
    error,
    
    // Data sources
    edges,
    things,
    organizationCode,
    
    // Message utilities
    generateStandardizedMessage,
    generateStandardTopic,
    parseStandardTopic,
    generateMessageFromButton,
    generateTopicFromButton,
    getMessageTemplates,
    
    // Configuration management
    saveConfig,
    loadConfig,
    
    // Button operations
    addButton,
    updateButton,
    deleteButton,
    
    // Subscription operations
    addSubscription,
    deleteSubscription,
    
    // Message operations
    publishMessage,
    
    // Import/Export
    importConfiguration,
    exportConfiguration
  }
}
