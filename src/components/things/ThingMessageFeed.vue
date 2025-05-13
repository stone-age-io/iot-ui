<!-- src/components/things/ThingMessageFeed.vue -->
<template>
  <div class="thing-message-feed">
    <!-- Header with NATS Status -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="card-title mb-0">Thing Message Stream</h3>
      <NatsStatus />
    </div>
    
    <!-- Connection Status Alert - When disconnected -->
    <div v-if="!connectionReady" class="mb-4 p-3 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-md">
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        <span>Waiting for NATS connection... Messages will appear once connected.</span>
      </div>
    </div>
    
    <!-- Organization Missing Alert -->
    <div v-else-if="!getOrganizationCode()" class="mb-4 p-3 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-md">
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        <span>Organization code not available. Using fallback topic pattern.</span>
      </div>
    </div>
    
    <!-- Topic Subscription Info -->
    <div v-if="connectionReady && calculatedTopic" class="mb-4 p-3 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-md">
      <div class="flex items-center">
        <i class="pi pi-info-circle mr-2"></i>
        <div>
          <div>Subscribed to topic: <span class="font-mono">{{ calculatedTopic }}</span></div>
          <div class="text-xs mt-1 opacity-80">Click Start to begin receiving messages for this thing.</div>
        </div>
      </div>
    </div>
    
    <!-- Feed Controls -->
    <div class="flex flex-wrap items-center justify-between mb-4 gap-2">
      <div class="flex items-center">
        <Button 
          :label="paused ? 'Start' : 'Pause'" 
          :icon="paused ? 'pi pi-play' : 'pi pi-pause'"
          :class="paused ? 'p-button-sm mr-2 p-button-success' : 'p-button-sm mr-2'"
          @click="togglePause"
          :disabled="!connectionReady || !calculatedTopic"
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
    
    <!-- Empty State with Start Prompt -->
    <div v-else-if="paginatedMessages.length === 0" class="empty-state">
      <i class="pi pi-inbox text-4xl mb-2 opacity-40"></i>
      <div class="text-center">
        <p>No messages received yet.</p>
        <p v-if="connectionReady && isSubscribed && paused" class="text-xs mt-1 max-w-md text-amber-600 dark:text-amber-400">
          Click the Start button to begin receiving messages.
        </p>
        <p v-else-if="connectionReady && isSubscribed" class="text-xs mt-1 max-w-md">
          Messages will appear here when they are received from the NATS server.
        </p>
        <p v-else-if="connectionReady && !calculatedTopic" class="text-xs mt-1 max-w-md text-amber-600 dark:text-amber-400">
          Unable to calculate subscription topic. Please make sure thing details are loaded.
        </p>
        <p v-else-if="connectionReady && !isSubscribed" class="text-xs mt-1 max-w-md text-amber-600 dark:text-amber-400">
          No topic subscribed. Please check your NATS settings.
        </p>
        <p v-else class="text-xs mt-1 max-w-md text-amber-600 dark:text-amber-400">
          Waiting for NATS connection...
        </p>
        
        <!-- Debug Info Button -->
        <Button 
          label="Debug Info" 
          icon="pi pi-info-circle" 
          class="p-button-sm p-button-text mt-3"
          @click="showDebugInfo = !showDebugInfo" 
        />
        
        <!-- Debug Info Panel -->
        <div v-if="showDebugInfo" class="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-left text-xs">
          <div><strong>Connection Ready:</strong> {{ connectionReady }}</div>
          <div><strong>Is Subscribed:</strong> {{ isSubscribed }}</div>
          <div><strong>Paused State:</strong> {{ paused }}</div>
          <div><strong>Calculated Topic:</strong> {{ calculatedTopic || 'None' }}</div>
          <div><strong>Organization Store Data:</strong> {{ organizationStoreData }}</div>
          <div><strong>Auth Store Data:</strong> {{ authStoreData }}</div>
          <div><strong>Thing Code:</strong> {{ thing?.code || 'None' }}</div>
          <div><strong>Thing Type:</strong> {{ thing?.type || 'None' }}</div>
          <div><strong>Edge Code:</strong> {{ getEdgeCode() || 'None' }}</div>
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
            <div class="flex flex-col mb-2">
              <!-- Timestamp and Actions in one row -->
              <div class="flex justify-between items-center mb-1">
                <small class="text-xs text-theme-secondary whitespace-nowrap">
                  {{ formatTimestamp(message.timestamp) }}
                </small>
                <div class="flex items-center space-x-1 shrink-0">
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
              
              <!-- Topic with intelligent display -->
              <div 
                class="topic-container py-1 px-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded"
              >
                <span class="topic-display">{{ formatTopicForDisplay(message.topic) }}</span>
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
    
    <!-- Paused Indicator - Shows when feed is active but paused -->
    <div v-if="paused && paginatedMessages.length > 0" class="paused-indicator mt-2 p-2 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 text-center text-sm rounded">
      <i class="pi pi-pause mr-1"></i> Message stream is paused. Click Start to resume.
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick, watch, computed } from 'vue';
import { useNatsMessages } from '../../composables/useNatsMessages';
import { useToast } from 'primevue/usetoast';
import { useOrganizationStore } from '../../stores/organization';
import { useAuthStore } from '../../stores/auth';
import NatsStatus from '../nats/NatsStatus.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';

// Props
const props = defineProps({
  /**
   * The thing object containing details
   * Required fields: code, type, edge.code
   */
  thing: {
    type: Object,
    required: true
  },
  /**
   * Maximum number of messages to display
   */
  maxMessages: {
    type: Number,
    default: 100
  }
});

// Get the organization store and auth store
const organizationStore = useOrganizationStore();
const authStore = useAuthStore();

// Debug information for organization and auth stores
const organizationStoreData = computed(() => {
  return {
    currentOrgId: organizationStore.currentOrganization?.id || null,
    currentOrgCode: organizationStore.currentOrganization?.code || null,
    hasUserOrgs: (organizationStore.userOrganizations?.length > 0) || false
  };
});

const authStoreData = computed(() => {
  return {
    isAuthenticated: authStore.isAuthenticated,
    userId: authStore.user?.id || null,
    currentOrgId: authStore.user?.current_organization_id || null
  };
});

// Debug state
const showDebugInfo = ref(false);
const expandedMessages = ref(new Set());
const toast = useToast();
const clipboardFallback = ref(null);
const messagesContainer = ref(null);
const messageListHeight = ref(300); // Default height

// Function to get edge code safely from the thing object
const getEdgeCode = () => {
  if (props.thing?.expand?.edge_id?.code) {
    return props.thing.expand.edge_id.code;
  }
  return null;
};

// Function to get organization code with multiple fallback options
const getOrganizationCode = () => {
  // First try from organization store
  if (organizationStore.currentOrganization?.code) {
    return organizationStore.currentOrganization.code;
  }
  
  // Second try from thing's organization_id
  if (props.thing?.expand?.organization_id?.code) {
    return props.thing.expand.organization_id.code;
  }
  
  // Try to derive code from organization name if available
  if (organizationStore.currentOrganization?.name) {
    // Generate a code from the name (first 3-4 chars lowercase)
    const name = organizationStore.currentOrganization.name;
    const derivedCode = name.trim().substring(0, 4).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (derivedCode.length >= 2) {
      console.log(`Using derived organization code: ${derivedCode} from name: ${name}`);
      return derivedCode;
    }
  }
  
  // If all else fails, use a default code
  return 'org';
};

// Function to calculate topic for this thing - with multiple fallback strategies
const calculatedTopic = computed(() => {
  if (!props.thing) return null;
  
  const thingCode = props.thing.code;
  const thingType = props.thing.type;
  const orgCode = getOrganizationCode();
  const edgeCode = getEdgeCode();
  
  // First, ensure we have the minimum required data
  if (!thingCode || !thingType) return null;
  
  // Build topic pattern with whatever information we have
  if (orgCode && edgeCode) {
    // Full topic pattern with all components
    return `${orgCode}.${edgeCode}.${thingType}.${thingCode}.>`;
  }
  else if (orgCode) {
    // Organization but no edge - use wildcard for edge
    return `${orgCode}.>.${thingType}.${thingCode}.>`;
  }
  else if (edgeCode) {
    // Edge but no organization
    return `org.${edgeCode}.${thingType}.${thingCode}.>`;
  }
  
  // Most generic fallback pattern
  return `>.${thingType}.${thingCode}.>`;
});

// Function to intelligently format topics for display
const formatTopicForDisplay = (topic) => {
  // Check if topic exceeds a certain length
  if (!topic) return '';
  
  // Try to intelligently format topic for display:
  // 1. For long topics, show clear start/end parts
  if (topic.length > 60) {
    // Find the last part of the topic (after the last dot or slash)
    const lastDotIndex = topic.lastIndexOf('.');
    const lastSlashIndex = topic.lastIndexOf('/');
    const lastSeparatorIndex = Math.max(lastDotIndex, lastSlashIndex);
    
    if (lastSeparatorIndex > 0 && lastSeparatorIndex > topic.length - 30) {
      // Show first 30 chars + ellipsis + last part (after the last separator)
      const prefix = topic.substring(0, 30);
      const suffix = topic.substring(lastSeparatorIndex);
      return `${prefix}...${suffix}`;
    }
    
    // For extremely long topics without structure, just show truncated version 
    // with ability to see full via tooltip
    return topic;
  }
  
  // For short topics, show the whole thing
  return topic;
};

// Preserve expanded state across page changes
const expandedMessagesByPage = ref(new Map());

// Use the enhanced NATS messages composable with specific configuration
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
  
  togglePause,
  clearMessages,
  formatMessageData,
  extractPayload,
  formatTimestamp,
  nextPage,
  prevPage,
  updateSpecificTopic
} = useNatsMessages({
  maxMessages: props.maxMessages,
  startPaused: true,
  showToasts: true,
  specificTopic: calculatedTopic.value, // Use the dynamically calculated topic
  namespace: `thing-${props.thing.id}` // Namespace to avoid collisions
});

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

// Watch for changes in the calculated topic and update the subscription
watch(calculatedTopic, (newTopic, oldTopic) => {
  // Only update if the topic has actually changed
  if (newTopic !== oldTopic) {
    console.log(`Topic changed from ${oldTopic} to ${newTopic}, updating subscription`);
    
    // Update the subscription with the new topic
    if (newTopic && connectionReady.value) {
      updateSpecificTopic(newTopic);
    }
  }
});

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

// Log organization details on mounted to help debugging
const logOrganizationDetails = () => {
  console.log('Organization Store Details:', {
    currentOrg: organizationStore.currentOrganization,
    userOrgs: organizationStore.userOrganizations?.length
  });
  
  console.log('Auth Store Details:', {
    userId: authStore.user?.id,
    currentOrgId: authStore.user?.current_organization_id
  });
  
  console.log('Calculated Topic:', calculatedTopic.value);
};

// Initialize component
onMounted(() => {
  // Log organization details for debugging
  logOrganizationDetails();
  
  // Calculate initial height
  updateListHeight();
  
  // Add watcher for paginated messages AFTER component is mounted
  watch(() => paginatedMessages.value, () => {
    nextTick(() => {
      updateListHeight();
    });
  }, { deep: true });
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

/* Paused indicator styles */
.paused-indicator {
  border-left: 3px solid rgb(217, 119, 6);
}

.dark .paused-indicator {
  border-left: 3px solid rgb(245, 158, 11);
}

/* Topic info box */
.topic-display {
  font-family: monospace;
  font-size: 0.85rem;
}
</style>
