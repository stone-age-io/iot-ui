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
    <div v-else ref="messagesContainer" class="messages-container">
      <!-- Fixed height container to prevent layout shifts -->
      <div class="messages-viewport" :style="{ height: messageListHeight + 'px' }">
        <div class="space-y-2 relative">
          <div 
            v-for="message in paginatedMessages" 
            :key="message.id"
            :data-message-id="message.id"
            class="message-item p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <!-- Message Header with Topic and Actions -->
            <div class="flex justify-between items-center mb-2">
              <div class="badge badge-blue text-xs py-0.5 px-2 truncate max-w-[150px] sm:max-w-[200px]">
                {{ message.topic }}
              </div>
              <div class="flex items-center space-x-1 shrink-0 ml-2">
                <small class="text-xs text-theme-secondary whitespace-nowrap">
                  {{ formatTimestamp(message.timestamp) }}
                </small>
                <Button 
                  icon="pi pi-copy" 
                  class="p-button-text p-button-rounded p-button-sm flex-shrink-0" 
                  v-tooltip.top="'Copy full message'" 
                  @click="copyMessage(message)"
                  style="width: 24px; height: 24px; padding: 0;"
                />
                <Button 
                  :icon="expandedMessages.has(message.id) ? 'pi pi-minus' : 'pi pi-plus'" 
                  class="p-button-text p-button-rounded p-button-sm flex-shrink-0" 
                  v-tooltip.top="expandedMessages.has(message.id) ? 'Collapse' : 'Expand'" 
                  @click="toggleExpand(message.id)"
                  style="width: 24px; height: 24px; padding: 0;"
                />
              </div>
            </div>
            
            <!-- Message Payload Only (Default View) -->
            <div v-if="!expandedMessages.has(message.id)" class="message-payload">
              <div class="code-container bg-gray-50 dark:bg-gray-900 rounded">
                <pre class="text-xs p-2 font-mono break-words whitespace-pre-wrap">{{ extractPayload(message.data) }}</pre>
              </div>
            </div>
            
            <!-- Full Message Details (Expanded View) -->
            <div v-else class="message-full transition-all duration-200">
              <div class="code-container bg-gray-50 dark:bg-gray-900 rounded">
                <pre class="text-xs p-2 font-mono break-words whitespace-pre-wrap">{{ formatMessageData(message.data) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Hidden textarea for clipboard copy fallback -->
    <textarea ref="clipboardFallback" class="sr-only" aria-hidden="true"></textarea>
    
    <!-- Toast for copy notification -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick, watch, computed } from 'vue';
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
const clipboardFallback = ref(null);
const messagesContainer = ref(null);
const messageListHeight = ref(300); // Default height

// Preserve expanded state across page changes
const expandedMessagesByPage = ref(new Map());

// Use the NATS messages composable with a maximum message limit
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

// Update the container height based on content
const updateListHeight = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      const container = messagesContainer.value.querySelector('.space-y-2');
      if (container) {
        // Get natural height but set a min/max
        const height = Math.max(
          200, // Min height
          Math.min(
            container.scrollHeight, 
            500 // Max height
          )
        );
        messageListHeight.value = height;
      }
    }
  });
};

// Watch for page changes to save/restore expanded state
// IMPORTANT: Define this watch AFTER updateListHeight is defined
watch(currentPage, (newPage, oldPage) => {
  // Save current expanded state
  expandedMessagesByPage.value.set(oldPage, new Set(expandedMessages.value));
  
  // Clear current expanded state
  expandedMessages.value.clear();
  
  // Restore expanded state for new page if exists
  const savedState = expandedMessagesByPage.value.get(newPage);
  if (savedState) {
    expandedMessages.value = new Set(savedState);
  }
  
  // Reset container height for smooth transition
  nextTick(() => {
    updateListHeight();
  });
});

// Set item height for smooth animations
const setItemHeight = (el) => {
  const height = el.offsetHeight;
  el.style.height = height + 'px';
};

// Extract payload for compact display
const extractPayload = (data) => {
  if (!data) return "{}";
  
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    // Create a compact representation with type and payload
    const compactView = {};
    
    // Always include type if available
    if (data.type) {
      compactView.type = data.type;
    }
    
    // Include payload if it exists
    if (data.payload) {
      compactView.payload = data.payload;
    } else {
      // If no direct payload, look for other key fields
      
      // Add a few important fields that might be useful
      if (data.id) compactView.id = data.id;
      if (data.ts) compactView.ts = data.ts;
      
      // If we don't have any fields yet, include some core data
      if (Object.keys(compactView).length <= 1) { // 1 because we might already have type
        // Look for other fields that might contain data
        if (data.context) compactView.context = data.context;
        if (data.data) compactView.data = data.data;
        if (data.message) compactView.message = data.message;
      }
    }
    
    // If we have fields, return the compact view
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
  
  // Update list height after DOM updates
  nextTick(() => {
    updateListHeight();
  });
};

// Copy full message to clipboard
const copyMessage = (message) => {
  // Prepare message text to copy
  const messageText = typeof message.data === 'object' 
    ? JSON.stringify(message.data, null, 2) 
    : String(message.data);
  
  // Try to use the modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(messageText)
      .then(() => {
        showCopySuccess();
      })
      .catch(err => {
        console.error("Clipboard API error:", err);
        // Fall back to the alternative method
        copyUsingFallback(messageText);
      });
  } else {
    // For browsers that don't support the Clipboard API
    copyUsingFallback(messageText);
  }
};

// Fallback clipboard copy method using textarea
const copyUsingFallback = (text) => {
  try {
    // Make sure we have the textarea reference
    if (!clipboardFallback.value) {
      console.error("Clipboard fallback element not found");
      showCopyFailed();
      return;
    }
    
    // Set the text to copy into the textarea
    const textarea = clipboardFallback.value;
    textarea.value = text;
    
    // Make the textarea visible but maintain accessibility
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    
    // Show the textarea
    textarea.style.display = 'block';
    
    // Select the text
    textarea.focus();
    textarea.select();
    
    // Copy the selected text
    const successful = document.execCommand('copy');
    
    // Hide the textarea again
    textarea.style.display = 'none';
    
    if (successful) {
      showCopySuccess();
    } else {
      showCopyFailed();
    }
  } catch (err) {
    console.error("Fallback clipboard error:", err);
    showCopyFailed();
  }
};

// Show success toast
const showCopySuccess = () => {
  toast.add({
    severity: 'success',
    summary: 'Copied to clipboard',
    detail: 'Message copied to clipboard',
    life: 3000
  });
};

// Show failure toast
const showCopyFailed = () => {
  toast.add({
    severity: 'error',
    summary: 'Copy failed',
    detail: 'Failed to copy message to clipboard. Try selecting and copying manually.',
    life: 5000
  });
};

// Initialize component - NOTE: All watchers are defined here to ensure proper initialization order
onMounted(() => {
  // Calculate initial height
  updateListHeight();
  
  // Add watcher for paginated messages AFTER component is mounted
  watch(() => paginatedMessages.value, () => {
    nextTick(() => {
      updateListHeight();
    });
  }, { deep: true });
});

// Clean up on component unmount
onBeforeUnmount(() => {
  unsubscribeFromAllTopics();
});
</script>

<style scoped>
.empty-state {
  @apply flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400 text-sm;
}

.messages-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 0.375rem;
}

.messages-viewport {
  width: 100%;
  overflow-y: auto;
  transition: height 0.2s ease-in-out;
}

/* Improved transition animations */
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
  position: absolute; /* Prevent layout shifts during leave animations */
  width: 100%;
}

.message-list-move {
  transition: transform 0.3s ease;
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

/* For screen readers only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
