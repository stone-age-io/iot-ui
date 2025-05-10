<!-- src/components/pubsub/PubSubSubscriptionPanel.vue -->
<template>
  <div class="subscription-panel">
    <!-- Header with topic info and controls -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <div class="text-sm text-content-secondary dark:text-content-secondary-dark">
          Topic: <span class="font-mono">{{ subscription.topic }}</span>
        </div>
        <div class="text-xs text-content-secondary dark:text-content-secondary-dark" v-if="status">
          {{ status }}
        </div>
      </div>
      
      <div class="flex gap-2">
        <ToggleButton 
          v-model="isPaused" 
          onIcon="pi pi-pause" 
          offIcon="pi pi-play" 
          onLabel="Paused" 
          offLabel="Running"
          class="p-button-sm"
          @change="handlePauseToggle"
        />
        <Button 
          icon="pi pi-trash" 
          class="p-button-sm p-button-danger" 
          @click="handleClear"
        />
      </div>
    </div>
    
    <!-- Message display area -->
    <div 
      class="message-container bg-surface-secondary dark:bg-gray-800 rounded-lg p-4"
      :class="{ 'no-messages': !hasMessages }"
    >
      <div v-if="!hasMessages" class="empty-state">
        <p class="text-content-secondary dark:text-content-secondary-dark">
          No messages received yet.
        </p>
      </div>
      
      <div v-else class="message-list">
        <div 
          v-for="(message, index) in visibleMessages" 
          :key="index"
          class="message-item"
        >
          <div class="message-header">
            <div class="message-timestamp">{{ formatTimestamp(message.timestamp) }}</div>
            <div class="message-controls">
              <Button 
                icon="pi pi-eye" 
                class="p-button-text p-button-sm p-button-rounded" 
                @click="toggleExpandMessage(index)"
              />
            </div>
          </div>
          
          <div class="message-content">
            <div v-if="message.expanded" class="message-payload">
              <pre>{{ formatMessageData(message.data) }}</pre>
            </div>
            <div v-else class="message-summary">
              {{ extractMessageSummary(message.data) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Message pagination (optional) -->
    <div v-if="hasMessages && totalPages > 1" class="pagination mt-3 flex justify-end items-center">
      <span class="text-xs text-content-secondary dark:text-content-secondary-dark mr-2">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <Button 
        icon="pi pi-chevron-left" 
        class="p-button-sm p-button-text p-button-rounded" 
        :disabled="currentPage === 1"
        @click="prevPage"
      />
      <Button 
        icon="pi pi-chevron-right" 
        class="p-button-sm p-button-text p-button-rounded" 
        :disabled="currentPage === totalPages"
        @click="nextPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useNatsMessages } from '../../composables/useNatsMessages'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'

// Define props
const props = defineProps({
  subscription: {
    type: Object,
    required: true
  }
})

// State
const currentPage = ref(1)
const pageSize = ref(10)
const expandedMessages = ref({})
const isPaused = ref(false)

// Initialize NATS subscription
const {
  messages,
  paginatedMessages,
  totalPages,
  currentPage: natsCurrentPage,
  pageSize: natsPageSize,
  paused,
  loading,
  isSubscribed,
  connectionReady,
  togglePause,
  clearMessages,
  goToPage,
  prevPage,
  nextPage,
  formatTimestamp,
  formatMessageData,
  extractPayload,
  subscribe,
  unsubscribe,
  reset
} = useNatsMessages({
  maxMessages: 100,
  startPaused: false,
  showToasts: false,
  specificTopic: props.subscription.topic,
  namespace: `sub-${props.subscription.id}`
})

// Computed properties
const hasMessages = computed(() => messages.value.length > 0)
const visibleMessages = computed(() => {
  return paginatedMessages.value.map((msg, index) => ({
    ...msg,
    expanded: !!expandedMessages.value[index]
  }))
})

const status = computed(() => {
  if (loading.value) return 'Connecting...'
  if (!connectionReady.value) return 'Not connected to NATS'
  if (!isSubscribed.value) return 'Not subscribed'
  if (paused.value) return 'Subscription paused'
  return `Subscribed (${messages.value.length} messages received)`
})

// Watch for NATS pagination
watch(natsCurrentPage, (newPage) => {
  currentPage.value = newPage
})

watch(paused, (newPaused) => {
  isPaused.value = newPaused
})

// Methods
function handlePauseToggle() {
  togglePause()
}

function handleClear() {
  clearMessages()
  expandedMessages.value = {}
}

function toggleExpandMessage(index) {
  expandedMessages.value = {
    ...expandedMessages.value,
    [index]: !expandedMessages.value[index]
  }
}

function extractMessageSummary(data) {
  try {
    return extractPayload(data, 100)
  } catch (error) {
    return typeof data === 'object' ? JSON.stringify(data) : String(data)
  }
}

// Lifecycle hooks
onMounted(async () => {
  // Subscribe to the specified topic
  if (connectionReady.value) {
    await subscribe(props.subscription.topic)
  }
  
  // Set page size if specified in subscription
  if (props.subscription.messageDisplay?.maxItems) {
    pageSize.value = props.subscription.messageDisplay.maxItems
    natsPageSize.value = props.subscription.messageDisplay.maxItems
  }
})

onUnmounted(() => {
  // Clean up subscription when component is unmounted
  reset()
})
</script>

<style scoped>
.subscription-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  min-height: 250px;
  max-height: 400px;
}

.no-messages {
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-item {
  padding: 0.75rem;
  border-radius: 0.375rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.message-timestamp {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.message-content {
  font-size: 0.875rem;
}

.message-summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-payload {
  overflow-x: auto;
}

.message-payload pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 150px;
  text-align: center;
}
</style>
