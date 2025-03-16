<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner strokeWidth="4" />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="card p-6 text-center">
      <div class="text-red-500 text-xl mb-4">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load thing details
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Thing Details -->
    <div v-else-if="thing">
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">
            <router-link :to="{ name: 'edges' }" class="text-primary-600 hover:underline">
              Edges
            </router-link>
            <i class="pi pi-angle-right mx-1 text-gray-400"></i>
            <router-link 
              :to="{ name: 'locations', query: { edge: thing.edge_id } }" 
              class="text-primary-600 hover:underline"
            >
              Locations
            </router-link>
            <i class="pi pi-angle-right mx-1 text-gray-400"></i>
            <router-link 
              :to="{ name: 'location-detail', params: { id: thing.location_id } }" 
              class="text-primary-600 hover:underline"
            >
              {{ thing.location?.code || thing.location_id }}
            </router-link>
          </div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ thing.name }}</h1>
          <div class="text-gray-600">
            <span class="font-mono">{{ thing.thing_code }}</span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToEdit"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="confirmDelete"
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="card lg:col-span-2">
          <h2 class="text-xl font-semibold mb-4">Thing Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Code -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Code</div>
              <div class="font-mono text-lg">{{ thing.thing_code }}</div>
            </div>
            
            <!-- Name -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Name</div>
              <div class="text-lg">{{ thing.name }}</div>
            </div>
            
            <!-- Type -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Type</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="getTypeClass(thing.thing_type)"
                >
                  {{ getTypeName(thing.thing_type) }}
                </span>
              </div>
            </div>
            
            <!-- Status -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Status</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="thing.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ thing.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            
            <!-- Location Reference -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Location</div>
              <div class="flex items-center">
                <router-link 
                  :to="{ name: 'location-detail', params: { id: thing.location_id } }"
                  class="text-primary-600 hover:underline flex items-center"
                >
                  {{ thing.location?.code || thing.location_id }}
                  <span class="text-gray-500 ml-2">{{ thing.location?.name }}</span>
                </router-link>
              </div>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Description</div>
              <div class="text-gray-700">{{ thing.description || 'No description provided' }}</div>
            </div>
          </div>
        </div>
        
        <!-- Monitoring & Status Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Monitoring</h2>
          
          <div class="space-y-6">
            <!-- Current Status -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Current Status</div>
              <div class="flex items-center">
                <span 
                  class="w-3 h-3 rounded-full mr-2"
                  :class="deviceStatus.online ? 'bg-green-500' : 'bg-red-500'"
                ></span>
                <div class="font-medium">{{ deviceStatus.online ? 'Online' : 'Offline' }}</div>
              </div>
              <div class="text-sm text-gray-500 mt-1">
                Last updated: {{ formatTime(deviceStatus.lastUpdated) }}
              </div>
            </div>
            
            <!-- Device Metrics (if available) -->
            <div v-if="deviceStatus.metrics && Object.keys(deviceStatus.metrics).length > 0">
              <div class="text-sm text-gray-500 mb-2">Device Metrics</div>
              <div class="space-y-3">
                <div 
                  v-for="(value, key) in deviceStatus.metrics" 
                  :key="key"
                  class="flex justify-between items-center"
                >
                  <div class="text-gray-700 capitalize">{{ formatMetricName(key) }}</div>
                  <div class="font-medium">{{ formatMetricValue(key, value) }}</div>
                </div>
              </div>
            </div>
            
            <!-- Created Date -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Created</div>
              <div class="text-gray-700">{{ formatDate(thing.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Last Updated</div>
              <div class="text-gray-700">{{ formatDate(thing.updated) }}</div>
            </div>
          </div>
          
          <!-- View in Grafana Button -->
          <div class="mt-6">
            <Button
              label="View in Grafana"
              icon="pi pi-external-link"
              @click="openInGrafana"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <!-- Message Stream Card -->
      <div class="card mt-6">
        <h2 class="text-xl font-semibold mb-4">Recent Messages</h2>
        
        <div v-if="messages.length === 0" class="text-center py-6 text-gray-500">
          No recent messages available.
        </div>
        
        <div v-else class="space-y-4">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            class="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
          >
            <div class="flex justify-between items-start mb-1">
              <div class="font-medium">{{ message.type }}</div>
              <div class="text-sm text-gray-500">{{ formatTime(message.timestamp) }}</div>
            </div>
            <div class="text-sm mb-2">{{ message.summary }}</div>
            <div 
              v-if="message.expanded" 
              class="bg-gray-50 p-3 rounded text-sm font-mono text-gray-700 break-all whitespace-pre-wrap"
            >
              {{ JSON.stringify(message.payload, null, 2) }}
            </div>
            <Button
              :label="message.expanded ? 'Hide Details' : 'Show Details'"
              :icon="message.expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              class="p-button-text p-button-sm mt-1"
              @click="message.expanded = !message.expanded"
            />
          </div>
        </div>
        
        <div class="flex justify-center mt-4">
          <Button
            label="Load More"
            icon="pi pi-refresh"
            class="p-button-outlined"
            :disabled="!hasMoreMessages"
            @click="loadMoreMessages"
          />
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:visible="deleteDialog.visible"
      title="Delete Thing"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete thing '${thing?.thing_code || ''}'?`"
      details="This action cannot be undone. All associated data will be deleted as well."
      @confirm="deleteThing"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { thingService, thingTypes } from '../../../services/thing'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Data
const thing = ref(null)
const loading = ref(true)
const error = ref(null)
const deleteDialog = ref({
  visible: false,
  loading: false
})

// Mock device status data (in a real app, this would come from an API)
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

// Mock message data (in a real app, this would come from an API)
const messages = ref([])
const hasMoreMessages = ref(true)

// Fetch thing data on component mount
onMounted(async () => {
  await fetchThing()
  await fetchMessages()
})

// Methods
const fetchThing = async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Invalid thing ID'
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const response = await thingService.getThing(id)
    thing.value = response.data
    
    // Set random online status for demo
    deviceStatus.value.online = Math.random() > 0.2
    deviceStatus.value.lastUpdated = new Date()
  } catch (err) {
    console.error('Error fetching thing:', err)
    error.value = 'Failed to load thing details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Mock function to fetch recent messages
const fetchMessages = async () => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Generate mock messages based on thing type
  const mockMessages = []
  
  if (thing.value) {
    if (thing.value.thing_type === 'reader') {
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
    } else if (thing.value.thing_type === 'temperature-sensor') {
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
  
  messages.value = mockMessages
  hasMoreMessages.value = true // In a real app, this would be based on API response
}

const loadMoreMessages = async () => {
  // In a real app, this would load the next page of messages
  // For this demo, we'll just add another mock message
  messages.value.push({
    type: 'device.status.heartbeat',
    timestamp: new Date(Date.now() - (messages.value.length + 1) * 60000),
    summary: 'Regular device heartbeat',
    expanded: false,
    payload: {
      uptime: 3000,
      memory_usage: 23.1,
      cpu_usage: 1.9
    }
  })
  
  // After a few loads, indicate no more messages
  if (messages.value.length > 5) {
    hasMoreMessages.value = false
  }
}

const navigateToEdit = () => {
  router.push({ name: 'edit-thing', params: { id: thing.value.id } })
}

const confirmDelete = () => {
  deleteDialog.value.visible = true
}

const deleteThing = async () => {
  deleteDialog.value.loading = true
  try {
    await thingService.deleteThing(thing.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Thing ${thing.value.thing_code} has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
    router.push({ name: 'things' })
  } catch (error) {
    console.error('Error deleting thing:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete thing',
      life: 3000
    })
  } finally {
    deleteDialog.value.loading = false
  }
}

const openInGrafana = () => {
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'https://grafana.domain.com'
  const dashboardUrl = `${grafanaUrl}/d/thing-monitoring/thing-monitoring?var-thing_id=${thing.value.id}`
  window.open(dashboardUrl, '_blank')
}

// Helper methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return dayjs(dateString).format('MMM D, YYYY HH:mm')
}

const formatTime = (dateObj) => {
  if (!dateObj) return 'N/A'
  return dayjs(dateObj).format('HH:mm:ss')
}

const getTypeName = (thingType) => {
  const type = thingTypes.find(t => t.value === thingType)
  return type ? type.label : thingType
}

const getTypeClass = (thingType) => {
  switch (thingType) {
    case 'reader': return 'bg-blue-100 text-blue-800'
    case 'controller': return 'bg-purple-100 text-purple-800'
    case 'lock': return 'bg-amber-100 text-amber-800'
    case 'temperature-sensor': return 'bg-green-100 text-green-800'
    case 'humidity-sensor': return 'bg-cyan-100 text-cyan-800'
    case 'hvac': return 'bg-teal-100 text-teal-800'
    case 'lighting': return 'bg-yellow-100 text-yellow-800'
    case 'camera': return 'bg-red-100 text-red-800'
    case 'motion-sensor': return 'bg-indigo-100 text-indigo-800'
    case 'occupancy-sensor': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const formatMetricName = (key) => {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

const formatMetricValue = (key, value) => {
  // Format value based on metric type
  if (key === 'batteryLevel') {
    return `${value}%`
  } else if (key === 'signalStrength') {
    return `${value} dBm`
  } else if (key === 'temperature') {
    return `${value}°C`
  }
  return value
}
</script>
