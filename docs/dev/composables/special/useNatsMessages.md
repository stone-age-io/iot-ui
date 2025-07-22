# useNatsMessages

## Overview

The `useNatsMessages` composable manages NATS message subscriptions, display, and real-time message handling with pagination and filtering capabilities. It provides a flexible interface for subscribing to NATS topics, managing message streams, and displaying real-time IoT data with proper performance optimization.

## Location

```
src/composables/useNatsMessages.js
```

## Purpose

- **Message Subscription Management**: Subscribe/unsubscribe from NATS topics
- **Real-time Message Display**: Live message streaming with pagination
- **Message Filtering**: Topic-based and content-based filtering
- **Performance Optimization**: Message batching and memory management
- **Pause/Resume Control**: User control over message reception
- **Multiple Instances**: Support for multiple message viewers with namespaces

## Dependencies

```javascript
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import natsService from '@/services/nats/natsService'
import { natsConfigService } from '@/services/nats/natsConfigService'
import { useApiOperation } from '@/composables/useApiOperation'
import { useOrganizationStore } from '@/stores/organization'
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `options` | `Object` | No | `{}` | Configuration options |

### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `maxMessages` | `number` | No | `100` | Maximum messages to store |
| `startPaused` | `boolean` | No | `true` | Start in paused state |
| `showToasts` | `boolean` | No | `true` | Show toast notifications |
| `specificTopic` | `string\|Array` | No | `null` | Specific topic(s) to subscribe to |
| `namespace` | `string` | No | `'default'` | Unique namespace for multiple instances |

## Returns

```javascript
{
  // State
  messages: Ref<Array>,
  paused: Ref<boolean>,
  subscriptions: Ref<Object>,
  topics: Ref<Array>,
  loading: Ref<boolean>,
  error: Ref<string|null>,
  isSubscribed: Ref<boolean>,
  connectionReady: Ref<boolean>,
  
  // Pagination
  currentPage: Ref<number>,
  pageSize: Ref<number>,
  paginatedMessages: ComputedRef<Array>,
  totalPages: ComputedRef<number>,
  
  // Operations
  subscribeToAllTopics: Function,
  unsubscribeFromAllTopics: Function,
  subscribe: Function,
  unsubscribe: Function,
  togglePause: Function,
  clearMessages: Function,
  
  // Pagination
  nextPage: Function,
  previousPage: Function,
  goToPage: Function,
  
  // Helpers
  formatMessage: Function,
  formatTimestamp: Function
}
```

---

## State Properties

### messages

Reactive array containing received messages with metadata.

**Type:** `Ref<Array>`

**Message Structure:**

```javascript
{
  id: "msg_123456789",
  topic: "sensors.temp.room-101",
  data: { temperature: 23.5, humidity: 45 },
  timestamp: "2024-01-15T10:30:00.123Z",
  size: 64,
  formatted_data: "{\n  \"temperature\": 23.5,\n  \"humidity\": 45\n}"
}
```

### paused

Boolean indicating if message reception is paused.

**Type:** `Ref<boolean>`

### subscriptions

Object containing active subscriptions by topic.

**Type:** `Ref<Object>`

**Structure:**

```javascript
{
  "sensors.*.temperature": {
    id: "sub_123",
    topic: "sensors.*.temperature",
    active: true,
    messageCount: 145
  }
}
```

### connectionReady

Boolean indicating if NATS connection is ready.

**Type:** `Ref<boolean>`

### paginatedMessages

Computed array of messages for current page.

**Type:** `ComputedRef<Array>`

### totalPages

Computed total number of pages based on message count and page size.

**Type:** `ComputedRef<number>`

---

## Operation Methods

### subscribeToAllTopics()

Subscribes to all configured NATS topics.

**Returns:** `Promise<boolean>` - Success status

**Usage:**

```javascript
const { subscribeToAllTopics } = useNatsMessages()

const success = await subscribeToAllTopics()
if (success) {
  console.log('Successfully subscribed to all topics')
}
```

### unsubscribeFromAllTopics()

Unsubscribes from all active topics.

**Returns:** `Promise<void>`

### subscribe(topic)

Subscribes to a specific NATS topic.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | `string` | Yes | NATS topic pattern |

**Returns:** `Promise<boolean>` - Success status

**Usage:**

```javascript
const { subscribe } = useNatsMessages()

const success = await subscribe('sensors.temperature.*')
```

### unsubscribe(topic)

Unsubscribes from a specific topic.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | `string` | Yes | NATS topic pattern |

**Returns:** `Promise<boolean>` - Success status

### togglePause(showNotification)

Toggles pause/resume state of message reception.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `showNotification` | `boolean` | No | Global setting | Override toast notification setting |

**Usage:**

```javascript
const { togglePause, paused } = useNatsMessages()

// Toggle with notification
togglePause(true)

// Check current state
console.log('Paused:', paused.value)
```

### clearMessages(showNotification)

Clears all stored messages.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `showNotification` | `boolean` | No | Global setting | Override toast notification setting |

---

## Pagination Methods

### nextPage()

Navigates to the next page of messages.

**Returns:** `void`

### previousPage()

Navigates to the previous page of messages.

**Returns:** `void`

### goToPage(page)

Navigates to a specific page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | `number` | Yes | Target page number (1-based) |

---

## Helper Methods

### formatMessage(data, maxLength)

Formats message data for display with optional truncation.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `data` | `any` | Yes | - | Message data to format |
| `maxLength` | `number` | No | `100` | Maximum string length |

**Returns:** `string` - Formatted message data

**Usage:**

```javascript
const { formatMessage } = useNatsMessages()

const formatted = formatMessage({ temp: 23.5, humidity: 45 }, 50)
// Output: "{ \"temp\": 23.5, \"humidity\": 45 }"
```

### formatTimestamp(timestamp, includeDate)

Formats timestamp for display.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timestamp` | `Date\|string` | Yes | - | Timestamp to format |
| `includeDate` | `boolean` | No | `false` | Include date in output |

**Returns:** `string` - Formatted timestamp

**Usage:**

```javascript
const { formatTimestamp } = useNatsMessages()

const time = formatTimestamp(new Date(), false)
// Output: "14:30:25.123"

const dateTime = formatTimestamp(new Date(), true)
// Output: "Jan 15, 2024 14:30:25.123"
```

---

## Usage Examples

### Basic Message Monitoring

```vue
<template>
  <div class="nats-messages">
    <!-- Header with connection status -->
    <Card class="mb-4">
      <template #title>
        <div class="flex justify-between items-center">
          <span>NATS Messages</span>
          <div class="flex items-center gap-3">
            <!-- Connection status -->
            <div class="flex items-center gap-2">
              <div 
                class="w-3 h-3 rounded-full"
                :class="connectionReady ? 'bg-green-500' : 'bg-red-500'"
              ></div>
              <span class="text-sm">
                {{ connectionReady ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            
            <!-- Subscription status -->
            <Badge 
              :value="isSubscribed ? 'Subscribed' : 'Not subscribed'"
              :severity="isSubscribed ? 'success' : 'secondary'"
            />
          </div>
        </div>
      </template>
      <template #content>
        <div class="flex justify-between items-center">
          <!-- Controls -->
          <div class="flex gap-2">
            <Button 
              :label="isSubscribed ? 'Unsubscribe' : 'Subscribe'"
              :icon="isSubscribed ? 'pi pi-stop' : 'pi pi-play'"
              @click="handleSubscriptionToggle"
              :loading="loading"
            />
            <Button 
              :label="paused ? 'Resume' : 'Pause'"
              :icon="paused ? 'pi pi-play' : 'pi pi-pause'"
              @click="togglePause"
              :disabled="!isSubscribed"
              class="p-button-secondary"
            />
            <Button 
              label="Clear"
              icon="pi pi-trash"
              @click="clearMessages"
              :disabled="messages.length === 0"
              class="p-button-danger p-button-outlined"
            />
          </div>
          
          <!-- Message stats -->
          <div class="text-sm text-gray-600">
            {{ messages.length }} messages
            <span v-if="paused" class="text-orange-600">(Paused)</span>
          </div>
        </div>
      </template>
    </Card>
    
    <!-- Active subscriptions -->
    <Card v-if="Object.keys(subscriptions).length > 0" class="mb-4">
      <template #title>Active Subscriptions</template>
      <template #content>
        <div class="flex flex-wrap gap-2">
          <Badge 
            v-for="(sub, topic) in subscriptions" 
            :key="topic"
            :value="`${topic} (${sub.messageCount || 0})`"
            severity="info"
            class="cursor-pointer"
            @click="filterByTopic(topic)"
          />
        </div>
      </template>
    </Card>
    
    <!-- Messages display -->
    <Card>
      <template #title>
        <div class="flex justify-between items-center">
          <span>Messages</span>
          
          <!-- Pagination controls -->
          <div v-if="totalPages > 1" class="flex items-center gap-2">
            <Button 
              icon="pi pi-angle-left"
              @click="previousPage"
              :disabled="currentPage === 1"
              class="p-button-sm p-button-text"
            />
            <span class="text-sm">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <Button 
              icon="pi pi-angle-right"
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="p-button-sm p-button-text"
            />
          </div>
        </div>
      </template>
      <template #content>
        <!-- Messages list -->
        <div v-if="paginatedMessages.length > 0" class="space-y-3">
          <div 
            v-for="message in paginatedMessages" 
            :key="message.id"
            class="border rounded-lg p-3 hover:bg-gray-50"
          >
            <!-- Message header -->
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center gap-2">
                <Badge :value="message.topic" class="font-mono text-xs" />
                <span class="text-xs text-gray-500">
                  {{ formatTimestamp(message.timestamp, true) }}
                </span>
              </div>
              <span class="text-xs text-gray-400">
                {{ message.size }} bytes
              </span>
            </div>
            
            <!-- Message content -->
            <pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ message.formatted_data }}</pre>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else class="text-center py-8 text-gray-500">
          <i class="pi pi-inbox text-4xl mb-4"></i>
          <p v-if="!isSubscribed">Subscribe to topics to see messages</p>
          <p v-else-if="paused">Message reception is paused</p>
          <p v-else>No messages received yet</p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { useNatsMessages } from '@/composables/useNatsMessages'

// Initialize NATS messages composable
const {
  messages,
  paused,
  subscriptions,
  loading,
  isSubscribed,
  connectionReady,
  currentPage,
  totalPages,
  paginatedMessages,
  subscribeToAllTopics,
  unsubscribeFromAllTopics,
  togglePause,
  clearMessages,
  nextPage,
  previousPage,
  formatTimestamp
} = useNatsMessages({
  maxMessages: 100,
  startPaused: true,
  showToasts: true
})

// Handle subscription toggle
const handleSubscriptionToggle = async () => {
  if (isSubscribed.value) {
    await unsubscribeFromAllTopics()
  } else {
    await subscribeToAllTopics()
  }
}

// Filter messages by topic (example implementation)
const filterByTopic = (topic) => {
  console.log('Filter by topic:', topic)
  // Implement topic filtering logic
}
</script>
```

### Multi-Instance Message Monitoring

```vue
<template>
  <div class="multi-nats-monitor">
    <!-- Device messages -->
    <Card class="mb-4">
      <template #title>Device Messages</template>
      <template #content>
        <NatsMessageViewer
          :messages="deviceMessages.paginatedMessages.value"
          :loading="deviceMessages.loading.value"
          :paused="deviceMessages.paused.value"
          @toggle-pause="deviceMessages.togglePause"
          @clear="deviceMessages.clearMessages"
        />
      </template>
    </Card>
    
    <!-- Alert messages -->
    <Card class="mb-4">
      <template #title>Alert Messages</template>
      <template #content>
        <NatsMessageViewer
          :messages="alertMessages.paginatedMessages.value"
          :loading="alertMessages.loading.value"
          :paused="alertMessages.paused.value"
          @toggle-pause="alertMessages.togglePause"
          @clear="alertMessages.clearMessages"
          severity="warn"
        />
      </template>
    </Card>
    
    <!-- System messages -->
    <Card>
      <template #title>System Messages</template>
      <template #content>
        <NatsMessageViewer
          :messages="systemMessages.paginatedMessages.value"
          :loading="systemMessages.loading.value"
          :paused="systemMessages.paused.value"
          @toggle-pause="systemMessages.togglePause"
          @clear="systemMessages.clearMessages"
          severity="info"
        />
      </template>
    </Card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useNatsMessages } from '@/composables/useNatsMessages'
import NatsMessageViewer from '@/components/NatsMessageViewer.vue'

// Device messages instance
const deviceMessages = useNatsMessages({
  specificTopic: ['devices.*.status', 'sensors.*.data'],
  namespace: 'devices',
  maxMessages: 50,
  startPaused: false
})

// Alert messages instance
const alertMessages = useNatsMessages({
  specificTopic: ['alerts.>', 'errors.>'],
  namespace: 'alerts',
  maxMessages: 25,
  startPaused: false
})

// System messages instance
const systemMessages = useNatsMessages({
  specificTopic: ['system.>', 'health.>'],
  namespace: 'system',
  maxMessages: 30,
  startPaused: true
})

onMounted(async () => {
  // Start subscriptions for each instance
  await Promise.all([
    deviceMessages.subscribeToAllTopics(),
    alertMessages.subscribeToAllTopics(),
    systemMessages.subscribeToAllTopics()
  ])
})
</script>
```

### Advanced Message Filtering and Search

```vue
<template>
  <div class="advanced-nats-monitor">
    <!-- Filter controls -->
    <Card class="mb-4">
      <template #title>Message Filters</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Topic filter -->
          <div>
            <label class="block text-sm font-medium mb-2">Topic Pattern</label>
            <InputText
              v-model="filters.topic"
              placeholder="e.g., sensors.*"
              @input="applyFilters"
            />
          </div>
          
          <!-- Content search -->
          <div>
            <label class="block text-sm font-medium mb-2">Content Search</label>
            <InputText
              v-model="filters.content"
              placeholder="Search message content"
              @input="applyFilters"
            />
          </div>
          
          <!-- Time range -->
          <div>
            <label class="block text-sm font-medium mb-2">Time Range</label>
            <Dropdown
              v-model="filters.timeRange"
              :options="timeRangeOptions"
              @change="applyFilters"
            />
          </div>
          
          <!-- Message limit -->
          <div>
            <label class="block text-sm font-medium mb-2">Show Last</label>
            <Dropdown
              v-model="filters.limit"
              :options="limitOptions"
              @change="applyFilters"
            />
          </div>
        </div>
        
        <div class="flex justify-between items-center mt-4">
          <div class="flex gap-2">
            <Button 
              label="Clear Filters"
              icon="pi pi-filter-slash"
              @click="clearFilters"
              class="p-button-secondary p-button-sm"
            />
            <Button 
              label="Export Messages"
              icon="pi pi-download"
              @click="exportMessages"
              class="p-button-sm"
              :disabled="filteredMessages.length === 0"
            />
          </div>
          
          <div class="text-sm text-gray-600">
            {{ filteredMessages.length }} of {{ messages.length }} messages
          </div>
        </div>
      </template>
    </Card>
    
    <!-- Filtered messages display -->
    <Card>
      <template #title>
        <div class="flex justify-between items-center">
          <span>Filtered Messages</span>
          <div class="flex items-center gap-2">
            <!-- Auto-scroll toggle -->
            <div class="flex items-center">
              <Checkbox
                v-model="autoScroll"
                inputId="autoscroll"
                :binary="true"
              />
              <label for="autoscroll" class="ml-2 text-sm">Auto-scroll</label>
            </div>
            
            <!-- Real-time indicator -->
            <div 
              v-if="!paused"
              class="flex items-center gap-1 text-green-600"
            >
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs">Live</span>
            </div>
          </div>
        </div>
      </template>
      <template #content>
        <div 
          ref="messagesContainer"
          class="max-h-96 overflow-y-auto"
        >
          <DataTable 
            :value="paginatedFilteredMessages"
            class="p-datatable-sm"
            :paginator="false"
            dataKey="id"
          >
            <Column field="timestamp" header="Time" style="width: 180px">
              <template #body="{ data }">
                <span class="font-mono text-xs">
                  {{ formatTimestamp(data.timestamp, true) }}
                </span>
              </template>
            </Column>
            
            <Column field="topic" header="Topic" style="width: 200px">
              <template #body="{ data }">
                <Badge 
                  :value="data.topic"
                  class="font-mono text-xs"
                />
              </template>
            </Column>
            
            <Column field="data" header="Message">
              <template #body="{ data }">
                <div class="font-mono text-xs">
                  {{ formatMessage(data.data, 100) }}
                </div>
              </template>
            </Column>
            
            <Column style="width: 60px">
              <template #body="{ data }">
                <Button 
                  icon="pi pi-eye"
                  @click="viewMessage(data)"
                  class="p-button-text p-button-sm"
                />
              </template>
            </Column>
          </DataTable>
        </div>
        
        <!-- Pagination for filtered messages -->
        <Paginator
          v-if="filteredMessages.length > pageSize"
          :rows="pageSize"
          :totalRecords="filteredMessages.length"
          :first="(currentFilterPage - 1) * pageSize"
          @page="onFilterPageChange"
          class="mt-4"
        />
      </template>
    </Card>
    
    <!-- Message detail dialog -->
    <Dialog 
      v-model:visible="showMessageDetail"
      header="Message Details"
      :style="{ width: '600px' }"
    >
      <div v-if="selectedMessage" class="space-y-4">
        <div>
          <strong>Topic:</strong> 
          <span class="font-mono">{{ selectedMessage.topic }}</span>
        </div>
        <div>
          <strong>Timestamp:</strong> 
          {{ formatTimestamp(selectedMessage.timestamp, true) }}
        </div>
        <div>
          <strong>Size:</strong> {{ selectedMessage.size }} bytes
        </div>
        <div>
          <strong>Message Data:</strong>
          <pre class="bg-gray-100 p-3 rounded mt-2 overflow-auto">{{ selectedMessage.formatted_data }}</pre>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useNatsMessages } from '@/composables/useNatsMessages'

const {
  messages,
  paused,
  paginatedMessages,
  formatMessage,
  formatTimestamp
} = useNatsMessages({
  maxMessages: 500,
  startPaused: false
})

// Filter state
const filters = ref({
  topic: '',
  content: '',
  timeRange: 'all',
  limit: 100
})

const autoScroll = ref(true)
const showMessageDetail = ref(false)
const selectedMessage = ref(null)
const messagesContainer = ref(null)
const currentFilterPage = ref(1)
const pageSize = ref(25)

// Filter options
const timeRangeOptions = [
  { label: 'All time', value: 'all' },
  { label: 'Last hour', value: 'hour' },
  { label: 'Last 15 minutes', value: '15min' },
  { label: 'Last 5 minutes', value: '5min' }
]

const limitOptions = [
  { label: '50 messages', value: 50 },
  { label: '100 messages', value: 100 },
  { label: '200 messages', value: 200 },
  { label: '500 messages', value: 500 }
]

// Filtered messages
const filteredMessages = computed(() => {
  let filtered = [...messages.value]
  
  // Topic filter
  if (filters.value.topic) {
    const topicPattern = new RegExp(
      filters.value.topic.replace(/\*/g, '.*').replace(/\./g, '\\.')
    )
    filtered = filtered.filter(msg => topicPattern.test(msg.topic))
  }
  
  // Content filter
  if (filters.value.content) {
    const searchTerm = filters.value.content.toLowerCase()
    filtered = filtered.filter(msg => 
      JSON.stringify(msg.data).toLowerCase().includes(searchTerm)
    )
  }
  
  // Time range filter
  if (filters.value.timeRange !== 'all') {
    const now = new Date()
    const cutoff = new Date()
    
    switch (filters.value.timeRange) {
      case 'hour':
        cutoff.setHours(now.getHours() - 1)
        break
      case '15min':
        cutoff.setMinutes(now.getMinutes() - 15)
        break
      case '5min':
        cutoff.setMinutes(now.getMinutes() - 5)
        break
    }
    
    filtered = filtered.filter(msg => new Date(msg.timestamp) >= cutoff)
  }
  
  // Limit filter
  return filtered.slice(-filters.value.limit)
})

// Paginated filtered messages
const paginatedFilteredMessages = computed(() => {
  const start = (currentFilterPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredMessages.value.slice(start, end)
})

// Methods
const applyFilters = () => {
  currentFilterPage.value = 1
}

const clearFilters = () => {
  filters.value = {
    topic: '',
    content: '',
    timeRange: 'all',
    limit: 100
  }
  currentFilterPage.value = 1
}

const onFilterPageChange = (event) => {
  currentFilterPage.value = Math.floor(event.first / event.rows) + 1
}

const viewMessage = (message) => {
  selectedMessage.value = message
  showMessageDetail.value = true
}

const exportMessages = () => {
  const data = filteredMessages.value.map(msg => ({
    timestamp: msg.timestamp,
    topic: msg.topic,
    data: msg.data
  }))
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nats-messages-${new Date().toISOString().slice(0, 19)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Auto-scroll to bottom when new messages arrive
watch(() => filteredMessages.value.length, async () => {
  if (autoScroll.value && messagesContainer.value) {
    await nextTick()
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})
</script>
```

---

## Best Practices

### 1. Manage Message Memory Usage

```javascript
// ✅ Good - limit message storage and clean old messages
const messagesComposable = useNatsMessages({
  maxMessages: 100, // Reasonable limit
  namespace: 'device-monitoring'
})

// Periodically clean old messages
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  const filteredMessages = messages.value.filter(msg => 
    new Date(msg.timestamp).getTime() > oneHourAgo
  )
  // Update messages array
}, 5 * 60 * 1000) // Every 5 minutes
```

### 2. Use Appropriate Topic Patterns

```javascript
// ✅ Good - specific topic patterns
const deviceMessages = useNatsMessages({
  specificTopic: [
    'devices.*.status',      // Device status updates
    'sensors.temperature.*', // Temperature sensor data
    'alerts.devices.*'       // Device alerts only
  ]
})

// ❌ Avoid - overly broad patterns
const tooBoard = useNatsMessages({
  specificTopic: ['*', '*.>'] // Receives everything
})
```

### 3. Handle Connection States Properly

```javascript
// ✅ Good - respond to connection changes
const { connectionReady, isSubscribed, subscribeToAllTopics } = useNatsMessages()

watch(connectionReady, async (isReady) => {
  if (isReady && !isSubscribed.value) {
    // Auto-reconnect when connection is restored
    await subscribeToAllTopics()
  }
})
```

### 4. Optimize Message Display

```javascript
// ✅ Good - paginate and format appropriately
const formatForDisplay = (message) => {
  // Limit displayed data size
  const maxSize = 200
  let formatted = JSON.stringify(message.data, null, 2)
  
  if (formatted.length > maxSize) {
    formatted = formatted.substring(0, maxSize) + '...'
  }
  
  return formatted
}

// Use virtual scrolling for large message lists
const useVirtualizedMessages = () => {
  // Implement virtual scrolling for performance
}
```

### 5. Provide User Controls

```javascript
// ✅ Good - give users control over message flow
const messageControls = {
  pause: () => togglePause(true),
  resume: () => togglePause(false),
  clear: () => clearMessages(true),
  export: () => exportMessages(),
  filter: (pattern) => filterMessages(pattern)
}

// Auto-pause on high message volume
watch(() => messages.value.length, (count) => {
  if (count > 1000 && !paused.value) {
    togglePause(true)
    toast.add({
      severity: 'warn',
      summary: 'Auto-paused',
      detail: 'Message stream paused due to high volume'
    })
  }
})
```

The `useNatsMessages` composable provides comprehensive real-time message handling with proper performance optimization, user controls, and flexible filtering capabilities, making it ideal for monitoring IoT device communications and system events.
