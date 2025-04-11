<!-- src/components/dashboard/NatsMessageFeed.vue -->
<template>
  <div class="nats-message-feed">
    <!-- Card Header -->
    <div class="flex flex-wrap justify-between items-center mb-3 gap-2">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-semibold">NATS Messages</h3>
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
    <div v-if="loading" class="flex justify-center py-4">
      <ProgressSpinner style="width: 30px; height: 30px" />
      <span class="ml-2">Initializing subscriptions...</span>
    </div>
    
    <div v-else-if="error && !hasMessages" class="p-4 bg-red-50 text-red-700 rounded-md mb-3">
      <i class="pi pi-exclamation-circle mr-2"></i>
      {{ error }}
    </div>
    
    <div v-else-if="topics.length === 0" class="p-4 bg-blue-50 text-blue-700 rounded-md mb-3">
      <i class="pi pi-info-circle mr-2"></i>
      No subscription topics configured. Go to 
      <router-link to="/settings" class="underline font-medium">Settings</router-link> 
      to configure topics.
    </div>
    
    <!-- Empty State -->
    <div v-if="paginatedMessages.length === 0 && topics.length > 0" class="p-4 text-center text-gray-500">
      No messages received yet. Waiting for messages on topics: {{ topics.join(', ') }}
    </div>
    
    <!-- COMPACT VIEW - Table -->
    <div v-else-if="compactView" class="overflow-hidden border rounded-md">
      <div class="message-table-container overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Time</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payload</th>
              <th scope="col" class="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="message in paginatedMessages" :key="message.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <span 
                  class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getTopicClass(message.topic)"
                  :title="message.topic"
                >
                  {{ message.topic }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                {{ formatTimestamp(message.timestamp) }}
              </td>
              <td class="px-4 py-3">
                <div class="text-gray-900 font-mono text-xs truncate max-w-[500px]" :title="formatMessageData(message.data)">
                  {{ formatMessageDataPreview(message.data) }}
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
    <div v-else class="space-y-3">
      <div 
        v-for="message in paginatedMessages" 
        :key="message.id"
        class="message-card border rounded-md p-3 hover:bg-gray-50"
      >
        <div class="flex justify-between items-start mb-2">
          <span 
            class="inline-block px-2 py-1 rounded-full text-xs font-medium"
            :class="getTopicClass(message.topic)"
          >
            {{ message.topic }}
          </span>
          <span class="text-xs text-gray-500">{{ formatTimestamp(message.timestamp) }}</span>
        </div>
        
        <div class="message-data mt-2">
          <div 
            class="font-mono text-sm bg-gray-100 p-3 rounded cursor-pointer overflow-hidden"
            :class="{ 'max-h-32': !expandedMessages.includes(message.id) }"
            @click="toggleMessageExpand(message.id)"
          >
            <pre class="whitespace-pre-wrap break-words">{{ formatMessageData(message.data) }}</pre>
          </div>
          <div 
            v-if="!expandedMessages.includes(message.id) && isMessageExpandable(message.data)" 
            class="text-center text-xs text-blue-600 mt-1 cursor-pointer" 
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
    >
      <div v-if="selectedMessage" class="message-detail">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div class="text-sm text-gray-500">Topic</div>
            <div class="font-medium">{{ selectedMessage.topic }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Timestamp</div>
            <div class="font-medium">{{ formatTimestamp(selectedMessage.timestamp, true) }}</div>
          </div>
        </div>
        
        <div class="mb-4">
          <div class="text-sm text-gray-500 mb-1">Payload</div>
          <div class="bg-gray-100 p-3 rounded overflow-auto max-h-96">
            <pre class="font-mono text-sm whitespace-pre-wrap break-words">{{ formatMessageData(selectedMessage.data) }}</pre>
          </div>
        </div>
        
        <div class="flex justify-end">
          <Button 
            label="Copy Payload" 
            icon="pi pi-copy" 
            class="p-button-outlined p-button-sm mr-2"
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
      <span class="text-sm text-gray-500">
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
        
        <span class="flex items-center px-2 text-sm">
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
        <span class="text-sm text-gray-500">Rows:</span>
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
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useNatsMessages } from '../../composables/useNatsMessages';
import { useToast } from 'primevue/usetoast';
import natsService from '../../services/nats/natsService';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import ProgressSpinner from 'primevue/progressspinner';

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
const connectionAttemptCount = ref(0);
const maxConnectionAttempts = 3;

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
  goToPage,
  nextPage,
  prevPage
} = useNatsMessages(props.maxMessages);

// Check if we have messages despite an error
const hasMessages = computed(() => messages.value.length > 0);

// Computed property for the page size dropdown model
const pageSizeModel = computed({
  get: () => pageSize.value,
  set: (value) => {
    pageSize.value = value;
    // Reset to first page when changing page size
    goToPage(1);
  }
});

// Topic CSS class generator
const getTopicClass = (topic) => {
  // Generate a consistent color based on the topic string
  const hash = topic.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // List of color classes
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-amber-100 text-amber-800',
    'bg-red-100 text-red-800',
    'bg-cyan-100 text-cyan-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-teal-100 text-teal-800',
    'bg-orange-100 text-orange-800'
  ];
  
  // Select color based on hash
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Create a shortened preview of message data
const formatMessageDataPreview = (data) => {
  const formatted = formatMessageData(data);
  if (formatted.length <= 80) return formatted;
  return formatted.substring(0, 77) + '...';
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
        detail: 'Message payload copied to clipboard',
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

// Handle connection with retry logic
const connectWithRetry = async () => {
  // Skip if loading or max attempts reached
  if (loading.value || connectionAttemptCount.value >= maxConnectionAttempts) return;
  
  connectionAttemptCount.value++;
  console.log(`NATS subscription attempt ${connectionAttemptCount.value}/${maxConnectionAttempts}`);
  
  // Set initial page size
  pageSize.value = 5;
  
  // Check connection status directly
  if (natsService.isConnected()) {
    // If already connected, subscribe
    await subscribeToAllTopics();
  } else {
    // Not connected - try again after a delay
    setTimeout(async () => {
      // Check connection again before retrying
      if (natsService.isConnected()) {
        await subscribeToAllTopics();
      } else if (connectionAttemptCount.value < maxConnectionAttempts) {
        // Try again
        connectWithRetry();
      } else {
        // Max attempts reached, but if we still have topics, try to subscribe anyway
        if (topics.value.length > 0) {
          console.log('Max connection attempts reached, final subscription attempt');
          await subscribeToAllTopics();
        }
      }
    }, 1000); // Wait 1 second between attempts
  }
};

// Watch for NATS connection status changes
const setupConnectionWatcher = () => {
  const statusHandler = async (status) => {
    if (status === 'connected') {
      // When connection becomes available, subscribe
      await subscribeToAllTopics();
    }
  };
  
  // Subscribe to status changes
  natsService.onStatusChange(statusHandler);
  
  // Clean up on component unmount
  onUnmounted(() => {
    natsService.removeStatusListener(statusHandler);
  });
};

// Initialize
onMounted(async () => {
  // Setup connection watcher
  setupConnectionWatcher();
  
  // Start connection attempt with retry logic
  connectWithRetry();
});
</script>

<style scoped>
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
  transition: box-shadow 0.2s ease;
}

.message-card:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-data pre {
  margin: 0;
  transition: max-height 0.3s ease;
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
    border-bottom: 1px solid #e5e7eb;
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
}
</style>
