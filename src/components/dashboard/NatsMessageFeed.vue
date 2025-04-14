<!-- src/components/dashboard/NatsMessageFeed.vue -->
<template>
  <div class="nats-message-feed">
    <!-- Card Header with Integrated NATS Status -->
    <div class="flex flex-wrap justify-between items-center mb-3 gap-2">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-semibold text-theme-primary">NATS Messages</h3>
        
        <!-- Integrated NATS Status Indicator -->
        <div class="nats-status-indicator px-2 py-0.5 rounded-full text-xs font-medium flex items-center" :class="statusClass">
          <div class="w-2 h-2 rounded-full mr-1.5" :class="statusIndicatorClass"></div>
          <span>{{ statusText }}</span>
        </div>
        
        <Badge
          v-tooltip="paused ? 'Message stream paused' : 'Receiving messages'"
          :value="paused ? 'Paused' : 'Live'" 
          :severity="paused ? 'warning' : 'success'"
        />
      </div>
      
      <div class="flex items-center gap-2">
        <!-- View toggle button -->
        <Button
          :icon="compactView ? 'pi pi-list' : 'pi pi-table'"
          class="p-button-text p-button-sm"
          @click="compactView = !compactView"
          v-tooltip="compactView ? 'Switch to expanded view' : 'Switch to compact view'"
        />
        
        <!-- Controls -->
        <Button
          :icon="paused ? 'pi pi-play' : 'pi pi-pause'"
          :class="[paused ? 'p-button-success' : 'p-button-warning', 'p-button-sm p-button-outlined']"
          @click="togglePause"
          :disabled="loading"
          v-tooltip="paused ? 'Resume message stream' : 'Pause message stream'"
        />
        
        <Button
          icon="pi pi-trash"
          class="p-button-danger p-button-sm p-button-outlined"
          @click="clearMessages"
          :disabled="loading || messages.length === 0"
          v-tooltip="'Clear all messages'"
        />
      </div>
    </div>
    
    <!-- Status Messages -->
    <div v-if="loading" class="flex justify-center py-4 text-theme-secondary">
      <ProgressSpinner style="width: 30px; height: 30px" />
      <span class="ml-2">Initializing subscriptions...</span>
    </div>
    
    <div v-else-if="connectionStatus === 'error'" class="p-4 bg-theme-error text-theme-error-contrast rounded-md mb-3">
      <i class="pi pi-exclamation-circle mr-2"></i>
      Connection error. Please check your NATS settings.
    </div>
    
    <div v-else-if="connectionStatus === 'disconnected'" class="p-4 bg-theme-warning text-theme-warning-contrast rounded-md mb-3">
      <i class="pi pi-exclamation-triangle mr-2"></i>
      Disconnected from NATS server. Reconnecting...
    </div>
    
    <div v-else-if="error && !hasMessages" class="p-4 bg-theme-error text-theme-error-contrast rounded-md mb-3">
      <i class="pi pi-exclamation-circle mr-2"></i>
      {{ error }}
    </div>
    
    <div v-else-if="topics.length === 0" class="p-4 bg-theme-info text-theme-info-contrast rounded-md mb-3">
      <i class="pi pi-info-circle mr-2"></i>
      No subscription topics configured. Go to 
      <router-link to="/settings" class="underline font-medium">Settings</router-link> 
      to configure topics.
    </div>
    
    <!-- Empty State -->
    <div v-if="paginatedMessages.length === 0 && topics.length > 0 && connectionStatus === 'connected'" class="p-4 text-center text-theme-secondary">
      No messages received yet. Waiting for messages on topics: {{ topics.join(', ') }}
    </div>
    
    <!-- COMPACT VIEW - Table -->
    <div v-else-if="compactView && paginatedMessages.length > 0" class="overflow-hidden border border-theme rounded-md">
      <div class="message-table-container overflow-x-auto">
        <table class="min-w-full divide-y divide-theme table-fixed">
          <thead class="bg-theme-header">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider w-1/4">Topic</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider w-1/6">Time</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider w-1/2">Payload</th>
              <th scope="col" class="px-4 py-3 w-14 text-right"></th>
            </tr>
          </thead>
          <tbody class="bg-theme-surface divide-y divide-theme">
            <tr v-for="message in paginatedMessages" :key="message.id" class="hover:bg-theme-hover">
              <td class="px-4 py-3 truncate">
                <span 
                  class="inline-block px-2 py-0.5 rounded-full text-xs font-medium truncate max-w-full"
                  :class="getTopicClass(message.topic)"
                  :title="message.topic"
                >
                  {{ message.topic }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-theme-secondary whitespace-nowrap">
                {{ formatTimestamp(message.timestamp) }}
              </td>
              <td class="px-4 py-3 truncate">
                <div class="text-theme-primary font-mono text-xs truncate" :title="formatMessageData(message.data)">
                  {{ formatMessagePayloadOnly(message.data) }}
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <Button
                  icon="pi pi-external-link"
                  class="p-button-text p-button-rounded p-button-sm"
                  v-tooltip="'View full message'"
                  @click="openMessageDetail(message)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- EXPANDED VIEW - Cards -->
    <div v-else-if="!compactView && paginatedMessages.length > 0" class="space-y-3">
      <div 
        v-for="message in paginatedMessages" 
        :key="message.id"
        class="message-card border border-theme rounded-md p-3 hover:bg-theme-hover"
      >
        <div class="flex justify-between items-start mb-2">
          <span 
            class="inline-block px-2 py-1 rounded-full text-xs font-medium"
            :class="getTopicClass(message.topic)"
          >
            {{ message.topic }}
          </span>
          <span class="text-xs text-theme-secondary">{{ formatTimestamp(message.timestamp) }}</span>
        </div>
        
        <div class="message-data mt-2">
          <div 
            class="font-mono text-sm bg-theme-code-bg p-3 rounded cursor-pointer overflow-hidden text-theme-code"
            :class="{ 'max-h-32': !expandedMessages.includes(message.id) }"
            @click="toggleMessageExpand(message.id)"
          >
            <pre class="whitespace-pre-wrap break-words">{{ formatMessageData(message.data) }}</pre>
          </div>
          <div 
            v-if="!expandedMessages.includes(message.id) && isMessageExpandable(message.data)" 
            class="text-center text-xs text-theme-link-color mt-1 cursor-pointer" 
            @click="toggleMessageExpand(message.id)"
          >
            Show more
          </div>
        </div>
      </div>
    </div>
    
    <!-- Message Detail Dialog -->
    <Dialog 
      v-model:visible="messageDetailVisible" 
      :style="{width: '90vw', maxWidth: '750px'}" 
      header="Message Detail" 
      :modal="true"
      :closable="true"
      class="message-detail-dialog"
    >
      <div v-if="selectedMessage" class="message-detail">
        <div class="message-header mb-5">
          <div class="mb-4">
            <div class="font-medium text-theme-secondary mb-1 text-base">Topic</div>
            <div class="bg-theme-surface-alt p-2 rounded border border-theme font-medium text-theme-primary">{{ selectedMessage.topic }}</div>
          </div>
          <div>
            <div class="font-medium text-theme-secondary mb-1 text-base">Timestamp</div>
            <div class="bg-theme-surface-alt p-2 rounded border border-theme text-theme-primary">{{ formatTimestamp(selectedMessage.timestamp, true) }}</div>
          </div>
        </div>
        
        <div class="mb-5">
          <div class="font-medium text-theme-secondary mb-1 text-base">Payload</div>
          <div class="bg-theme-code-bg p-3 rounded border border-theme overflow-auto max-h-96">
            <pre class="font-mono text-sm whitespace-pre-wrap break-words text-theme-code">{{ formatMessageData(selectedMessage.data) }}</pre>
          </div>
        </div>
        
        <div class="flex justify-end gap-3">
          <Button 
            label="Copy Message" 
            icon="pi pi-copy" 
            class="p-button-outlined p-button-sm"
            @click="copyMessageData(selectedMessage.data)"
          />
          <Button 
            label="Close" 
            class="p-button-sm" 
            @click="messageDetailVisible = false"
          />
        </div>
      </div>
    </Dialog>
    
    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination flex justify-between items-center mt-4">
      <span class="text-sm text-theme-secondary">
        Showing {{ paginatedMessages.length }} of {{ messages.length }} messages
      </span>
      
      <div class="flex gap-1">
        <Button
          icon="pi pi-angle-double-left"
          class="p-button-text p-button-sm"
          @click="goToPage(1)"
          :disabled="currentPage === 1"
          v-tooltip="'First page'"
        />
        
        <Button
          icon="pi pi-angle-left"
          class="p-button-text p-button-sm"
          @click="prevPage"
          :disabled="currentPage === 1"
          v-tooltip="'Previous page'"
        />
        
        <span class="flex items-center px-2 text-sm text-theme-primary">
          {{ currentPage }} / {{ totalPages }}
        </span>
        
        <Button
          icon="pi pi-angle-right"
          class="p-button-text p-button-sm"
          @click="nextPage"
          :disabled="currentPage === totalPages"
          v-tooltip="'Next page'"
        />
        
        <Button
          icon="pi pi-angle-double-right"
          class="p-button-text p-button-sm"
          @click="goToPage(totalPages)"
          :disabled="currentPage === totalPages"
          v-tooltip="'Last page'"
        />
      </div>
      
      <div class="page-size-selector flex items-center gap-2">
        <span class="text-sm text-theme-secondary">Rows:</span>
        <Dropdown
          v-model="pageSizeModel"
          :options="pageSizeOptions"
          optionLabel="label"
          optionValue="value"
          class="p-inputtext-sm"
          style="min-width: 5rem"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useNatsMessages } from '../../composables/useNatsMessages';
import { useTheme } from '../../composables/useTheme';
import { useToast } from 'primevue/usetoast';
import natsService from '../../services/nats/natsService';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import ProgressSpinner from 'primevue/progressspinner';

// Use theme composable for reactive theme values
const { themeValue } = useTheme();

// Props
const props = defineProps({
  maxMessages: {
    type: Number,
    default: 100
  }
});

// Local state
const compactView = ref(true); // Default to compact view
const expandedMessages = ref([]); // Track expanded messages in expanded view
const messageDetailVisible = ref(false);
const selectedMessage = ref(null);
const toast = useToast();
const subscriptionInitialized = ref(false); // Track if we've already initialized subscriptions

// NATS connection status - integrated from NatsStatus component
const connectionStatus = ref('disconnected');
const statusListener = ref(null);

// Page size options for dropdown
const pageSizeOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '15', value: 15 },
  { label: '20', value: 20 },
  { label: '25', value: 25 }
];

// Use composable with default page size of 5
const {
  messages,
  paginatedMessages,
  totalPages,
  currentPage,
  pageSize,
  paused,
  topics,
  loading,
  error,
  togglePause,
  clearMessages,
  formatMessageData,
  formatTimestamp,
  subscribeToAllTopics,
  unsubscribeFromAllTopics,
  goToPage,
  nextPage,
  prevPage
} = useNatsMessages(props.maxMessages);

// Check if we have messages despite an error
const hasMessages = computed(() => messages.value.length > 0);

// Computed properties for NATS status display with theme-aware classes
const statusClass = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': 
      return themeValue.value.class('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300');
    case 'connecting': 
      return themeValue.value.class('bg-blue-100 text-blue-800', 'bg-blue-900/30 text-blue-300');
    case 'error': 
      return themeValue.value.class('bg-red-100 text-red-800', 'bg-red-900/30 text-red-300');
    default: 
      return themeValue.value.class('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300');
  }
});

const statusIndicatorClass = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'bg-green-500';
    case 'connecting': return 'bg-blue-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
});

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'Connected';
    case 'connecting': return 'Connecting';
    case 'error': return 'Error';
    default: return 'Disconnected';
  }
});

// Computed property for the page size dropdown model
const pageSizeModel = computed({
  get: () => pageSize.value,
  set: (value) => {
    pageSize.value = value;
    // Reset to first page when changing page size
    goToPage(1);
  }
});

// Format only the payload field
const formatMessagePayloadOnly = (data) => {
  try {
    // Parse the data if it's a string
    const message = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Check if it has a payload property
    if (message && message.payload) {
      // Return the stringified payload only
      return JSON.stringify(message.payload);
    }
    
    // Fallback to showing a shortened version of the full message
    return formatMessageDataPreview(data);
  } catch (error) {
    // In case of parsing error, return the original data preview
    return formatMessageDataPreview(data);
  }
};

// Create a shortened preview of message data
const formatMessageDataPreview = (data) => {
  const formatted = formatMessageData(data);
  if (formatted.length <= 80) return formatted;
  return formatted.substring(0, 77) + '...';
};

// Topic CSS class generator with theme support
const getTopicClass = (topic) => {
  // Generate a consistent color based on the topic string
  const hash = topic.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // List of color classes
  const colors = [
    themeValue.value.class('bg-blue-100 text-blue-800', 'bg-blue-900/30 text-blue-300'),
    themeValue.value.class('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300'),
    themeValue.value.class('bg-purple-100 text-purple-800', 'bg-purple-900/30 text-purple-300'),
    themeValue.value.class('bg-amber-100 text-amber-800', 'bg-amber-900/30 text-amber-300'),
    themeValue.value.class('bg-red-100 text-red-800', 'bg-red-900/30 text-red-300'),
    themeValue.value.class('bg-cyan-100 text-cyan-800', 'bg-cyan-900/30 text-cyan-300'),
    themeValue.value.class('bg-pink-100 text-pink-800', 'bg-pink-900/30 text-pink-300'),
    themeValue.value.class('bg-indigo-100 text-indigo-800', 'bg-indigo-900/30 text-indigo-300'),
    themeValue.value.class('bg-teal-100 text-teal-800', 'bg-teal-900/30 text-teal-300'),
    themeValue.value.class('bg-orange-100 text-orange-800', 'bg-orange-900/30 text-orange-300')
  ];
  
  // Select color based on hash
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Toggle message expansion in expanded view
const toggleMessageExpand = (messageId) => {
  const index = expandedMessages.value.indexOf(messageId);
  if (index === -1) {
    expandedMessages.value.push(messageId);
  } else {
    expandedMessages.value.splice(index, 1);
  }
};

// Check if message should show expand/collapse control
const isMessageExpandable = (data) => {
  const formatted = formatMessageData(data);
  return formatted.length > 100 || formatted.includes('\n');
};

// Open message detail dialog
const openMessageDetail = (message) => {
  selectedMessage.value = message;
  messageDetailVisible.value = true;
};

// Copy message data to clipboard
const copyMessageData = (data) => {
  const formatted = formatMessageData(data);
  navigator.clipboard.writeText(formatted)
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Message copied to clipboard',
        life: 2000
      });
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard',
        life: 3000
      });
    });
};

// Setup NATS connection status listener - from NatsStatus component
const setupStatusListener = () => {
  statusListener.value = (status) => {
    connectionStatus.value = status;
    
    // If we connect and haven't initialized subscriptions, do so
    if (status === 'connected' && !subscriptionInitialized.value) {
      console.log('Setting up initial NATS subscriptions');
      subscribeToAllTopics().then(() => {
        subscriptionInitialized.value = true;
      });
    }
  };
  
  natsService.onStatusChange(statusListener.value);
};

// Set initial page size
const initializePageSize = () => {
  pageSize.value = 5;
};

// Initialize
onMounted(() => {
  console.log('NatsMessageFeed component mounted');
  
  // Set initial page size
  initializePageSize();
  
  // Setup connection status listener
  setupStatusListener();
  
  // If already connected, subscribe to topics
  if (natsService.isConnected() && !subscriptionInitialized.value) {
    console.log('NATS already connected, setting up subscriptions');
    connectionStatus.value = 'connected';
    subscribeToAllTopics().then(() => {
      subscriptionInitialized.value = true;
    });
  }
});

// Clean up when unmounted
onUnmounted(() => {
  console.log('NatsMessageFeed component unmounting');
  
  // Remove status listener
  if (statusListener.value) {
    natsService.removeStatusListener(statusListener.value);
  }
  
  // Ensure we unsubscribe from all topics
  unsubscribeFromAllTopics();
  
  // Reset state
  subscriptionInitialized.value = false;
});
</script>

<style scoped>
/* Custom theme CSS variables */
:root {
  --theme-code-bg: #f1f5f9;
  --theme-code-color: #334155;
  --theme-link-color: #3b82f6;
  --theme-error-bg: #fef2f2;
  --theme-error-text: #b91c1c;
  --theme-info-bg: #eff6ff;
  --theme-info-text: #1e40af;
  --theme-warning-bg: #fffbeb;
  --theme-warning-text: #92400e;
}

.dark {
  --theme-code-bg: #1e293b;
  --theme-code-color: #cbd5e1;
  --theme-link-color: #60a5fa;
  --theme-error-bg: rgba(239, 68, 68, 0.2);
  --theme-error-text: #f87171;
  --theme-info-bg: rgba(59, 130, 246, 0.2);
  --theme-info-text: #93c5fd;
  --theme-warning-bg: rgba(245, 158, 11, 0.2);
  --theme-warning-text: #fbbf24;
}

/* NATS Status indicator */
.nats-status-indicator {
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Theme utility classes */
.bg-theme-code-bg {
  background-color: var(--theme-code-bg);
}

.text-theme-code {
  color: var(--theme-code-color);
}

.text-theme-link-color {
  color: var(--theme-link-color);
}

.bg-theme-error {
  background-color: var(--theme-error-bg);
}

.text-theme-error-contrast {
  color: var(--theme-error-text);
}

.bg-theme-info {
  background-color: var(--theme-info-bg);
}

.text-theme-info-contrast {
  color: var(--theme-info-text);
}

.bg-theme-warning {
  background-color: var(--theme-warning-bg);
}

.text-theme-warning-contrast {
  color: var(--theme-warning-text);
}

.bg-theme-header {
  @apply bg-gray-50 dark:bg-gray-700;
}

.bg-theme-hover {
  @apply bg-gray-50 dark:bg-gray-700;
}

.bg-theme-surface-alt {
  @apply bg-gray-50 dark:bg-gray-700;
}

/* Ensure table has proper layout and overflow handling */
.message-table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  table-layout: fixed;
}

/* Ensure column widths are appropriate */
td, th {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Message card styling in expanded view */
.message-card {
  transition: all 0.2s ease;
}

.message-data pre {
  margin: 0;
  transition: max-height 0.3s ease;
}

/* Dialog styling */
:deep(.message-detail-dialog .p-dialog-header) {
  padding: 1.25rem 1.5rem;
  border-bottom-width: 1px;
  border-bottom-style: solid;
}

:deep(.message-detail-dialog .p-dialog-content) {
  padding: 1.5rem;
}

:deep(.message-detail-dialog .p-dialog-header-close) {
  width: 2rem;
  height: 2rem;
}

/* Responsive adjustments for mobile */
@media (max-width: 640px) {
  table thead {
    display: none;
  }
  
  table tbody tr {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.25rem;
    padding: 0.75rem;
    border-bottom-width: 1px;
    border-bottom-style: solid;
  }
  
  table tbody td {
    padding: 0.25rem;
    border: none;
    display: flex;
    align-items: center;
  }
  
  table tbody td:nth-child(1)::before {
    content: 'Topic: ';
    font-weight: 500;
    font-size: 0.75rem;
    margin-right: 0.5rem;
  }
  
  table tbody td:nth-child(2)::before {
    content: 'Time: ';
    font-weight: 500;
    font-size: 0.75rem;
    margin-right: 0.5rem;
  }
  
  table tbody td:nth-child(3)::before {
    content: 'Payload: ';
    font-weight: 500;
    font-size: 0.75rem;
    margin-right: 0.5rem;
  }
  
  table tbody td:nth-child(4) {
    justify-content: flex-end;
  }
  
  /* Mobile dialog adjustments */
  :deep(.message-detail-dialog) {
    width: 95vw !important;
  }
  
  .message-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
