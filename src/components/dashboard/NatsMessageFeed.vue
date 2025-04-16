<!-- src/components/dashboard/NatsMessageFeed.vue -->
<template>
  <div class="nats-message-feed">
    <!-- Header with NATS Status -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="card-title mb-0">NATS Message Feed</h3>
      <NatsStatus />
    </div>
    
    <!-- Connection Status Alert - When disconnected -->
    <div v-if="!connectionReady" class="mb-4 p-3 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-md">
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        <span>Waiting for NATS connection... Messages will appear once connected.</span>
      </div>
    </div>
    
    <!-- Feed Controls -->
    <div class="flex flex-wrap items-center justify-between mb-4 gap-2">
      <div class="flex items-center">
        <Button 
          :label="paused ? 'Resume' : 'Pause'" 
          :icon="paused ? 'pi pi-play' : 'pi pi-pause'"
          class="p-button-sm mr-2"
          @click="togglePause"
          :disabled="!connectionReady || paginatedMessages.length === 0"
        />
        <Button 
          label="Clear" 
          icon="pi pi-trash" 
          class="p-button-sm p-button-secondary"
          @click="clearMessages"
          :disabled="paginatedMessages.length === 0"
        />
      </div>
      
      <div class="pagination flex items-center">
        <Button 
          icon="pi pi-angle-left" 
          class="p-button-sm p-button-text" 
          :disabled="currentPage <= 1 || paginatedMessages.length === 0"
          @click="prevPage" 
        />
        <span class="mx-2 text-sm text-theme-secondary">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <Button 
          icon="pi pi-angle-right" 
          class="p-button-sm p-button-text" 
          :disabled="currentPage >= totalPages || paginatedMessages.length === 0"
          @click="nextPage" 
        />
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="empty-state">
      <ProgressSpinner style="width: 24px; height: 24px" />
      <span class="ml-2">Loading messages...</span>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="paginatedMessages.length === 0" class="empty-state">
      <i class="pi pi-inbox text-4xl mb-2 opacity-40"></i>
      <div class="text-center">
        <p>No messages received yet.</p>
        <p v-if="connectionReady && isSubscribed" class="text-xs mt-1 max-w-md">
          Messages will appear here when they are received from the NATS server.
        </p>
        <p v-else-if="connectionReady && !isSubscribed" class="text-xs mt-1 max-w-md text-amber-600 dark:text-amber-400">
          No topics are subscribed. Please check your NATS settings.
        </p>
        <p v-else class="text-xs mt-1 max-w-md text-amber-600 dark:text-amber-400">
          Waiting for NATS connection...
        </p>
        
        <!-- Debug Info Button -->
        <Button 
          v-if="!connectionReady || !isSubscribed"
          label="Debug Info" 
          icon="pi pi-info-circle" 
          class="p-button-sm p-button-text mt-3"
          @click="showDebugInfo = !showDebugInfo" 
        />
        
        <!-- Debug Info Panel -->
        <div v-if="showDebugInfo" class="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-left text-xs">
          <div><strong>Connection Ready:</strong> {{ connectionReady }}</div>
          <div><strong>Is Subscribed:</strong> {{ isSubscribed }}</div>
          <div><strong>Topics:</strong> {{ topics.length > 0 ? topics.join(', ') : 'None' }}</div>
          <div v-if="error"><strong>Error:</strong> {{ error }}</div>
        </div>
      </div>
    </div>
    
    <!-- Messages - Compact view -->
    <div v-else class="messages-container">
      <TransitionGroup 
        name="message-list" 
        tag="div" 
        class="space-y-2"
      >
        <div 
          v-for="message in paginatedMessages" 
          :key="message.id"
          class="message-item p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <!-- Message Header with Topic and Actions -->
          <div class="flex justify-between items-center mb-1">
            <div class="badge badge-blue text-xs py-0.5 px-2">{{ message.topic }}</div>
            <div class="flex items-center space-x-1">
              <small class="text-xs text-theme-secondary mr-1">
                {{ formatTimestamp(message.timestamp) }}
              </small>
              <Button 
                icon="pi pi-copy" 
                class="p-button-text p-button-rounded p-button-sm" 
                v-tooltip.top="'Copy full message'" 
                @click="copyMessage(message)"
                style="width: 24px; height: 24px; padding: 0;"
              />
              <Button 
                :icon="expandedMessages.has(message.id) ? 'pi pi-minus' : 'pi pi-plus'" 
                class="p-button-text p-button-rounded p-button-sm" 
                v-tooltip.top="expandedMessages.has(message.id) ? 'Collapse' : 'Expand'" 
                @click="toggleExpand(message.id)"
                style="width: 24px; height: 24px; padding: 0;"
              />
            </div>
          </div>
          
          <!-- Message Payload Only (Default View) -->
          <div v-if="!expandedMessages.has(message.id)" class="message-payload">
            <pre class="text-xs overflow-x-auto p-1.5 bg-gray-50 dark:bg-gray-900 rounded font-mono" style="max-height: 100px;">{{ extractPayload(message.data) }}</pre>
          </div>
          
          <!-- Full Message Details (Expanded View) -->
          <div v-else class="message-full transition-all duration-200">
            <pre class="text-xs overflow-x-auto p-1.5 bg-gray-50 dark:bg-gray-900 rounded font-mono" style="max-height: 300px;">{{ formatMessageData(message.data) }}</pre>
          </div>
        </div>
      </TransitionGroup>
    </div>
    
    <!-- Toast for copy notification -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useNatsMessages } from '../../composables/useNatsMessages';
import { useToast } from 'primevue/usetoast';
import NatsStatus from '../nats/NatsStatus.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';

// Initialize component ID for tracking
const componentId = ref(`nats-feed-${Date.now()}`);

// Debug state
const showDebugInfo = ref(false);
const expandedMessages = ref(new Set());
const toast = useToast();

// Use the NATS messages composable
const { 
  messages,
  paginatedMessages,
  totalPages,
  currentPage,
  paused,
  loading,
  error,
  isSubscribed,
  connectionReady,
  topics,
  
  subscribeToAllTopics,
  unsubscribeFromAllTopics,
  togglePause,
  clearMessages,
  formatMessageData,
  formatTimestamp,
  nextPage,
  prevPage
} = useNatsMessages(100);

// Extract just the payload from a message for compact display
const extractPayload = (data) => {
  if (!data) return "{}";
  
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    // First look for 'payload' field
    if (data.payload) {
      return JSON.stringify(data.payload, null, 2);
    }
    
    // Try to find the most important fields
    const importantFields = {};
    
    // Common fields we want to show in compact view
    if (data.type) importantFields.type = data.type;
    if (data.payload) importantFields.payload = data.payload;
    
    // If there are no important fields, show a subset of all fields
    if (Object.keys(importantFields).length === 0) {
      // Show a limited selection of fields for compact view
      const compactView = {};
      
      // Add payload if it exists
      if (data.payload) {
        compactView.payload = data.payload;
      }
      
      // Add a few key fields if they exist
      if (data.type) compactView.type = data.type;
      if (data.id) compactView.id = data.id;
      if (data.ts) compactView.ts = data.ts;
      
      // If we found any fields, use them
      if (Object.keys(compactView).length > 0) {
        return JSON.stringify(compactView, null, 2);
      }
      
      // If we still don't have anything, just show abbreviated full message
      // Limit to a reasonable preview size
      const fullJson = JSON.stringify(data, null, 2);
      if (fullJson.length > 150) {
        return fullJson.substring(0, 150) + '...';
      }
      return fullJson;
    }
    
    return JSON.stringify(importantFields, null, 2);
  } catch (e) {
    // If anything goes wrong, just show the raw data
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  }
};

// Toggle expanded state for a message
const toggleExpand = (messageId) => {
  if (expandedMessages.value.has(messageId)) {
    expandedMessages.value.delete(messageId);
  } else {
    expandedMessages.value.add(messageId);
  }
};

// Copy full message to clipboard
const copyMessage = (message) => {
  const messageText = typeof message.data === 'object' 
    ? JSON.stringify(message.data, null, 2) 
    : String(message.data);
    
  navigator.clipboard.writeText(messageText)
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Copied to clipboard',
        detail: 'Message copied to clipboard',
        life: 3000
      });
    })
    .catch(err => {
      console.error('Failed to copy message:', err);
      toast.add({
        severity: 'error',
        summary: 'Copy failed',
        detail: 'Failed to copy message to clipboard',
        life: 3000
      });
    });
};

// Clean up on component unmount
onBeforeUnmount(() => {
  unsubscribeFromAllTopics();
});
</script>

<style scoped>
.empty-state {
  @apply flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400 text-sm;
}

.message-list-enter-active,
.message-list-leave-active {
  transition: all 0.3s ease;
}

.message-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.message-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}

/* Custom scrollbar styling for pre elements */
pre::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

pre::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

pre::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

pre::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.dark pre::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.dark pre::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark pre::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
