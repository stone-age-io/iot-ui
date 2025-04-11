<!-- src/views/Settings/NatsSettings.vue -->
<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">NATS Connection Settings</h2>
    
    <!-- Connection Status -->
    <div class="mb-6 p-4 rounded-lg" :class="statusClass">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-2" :class="statusIndicatorClass"></div>
        <div class="font-medium">{{ statusText }}</div>
      </div>
      <div v-if="errorMessage" class="mt-2 text-red-700">
        {{ errorMessage }}
      </div>
    </div>
    
    <!-- NATS Configuration Form -->
    <EntityForm
      :loading="loading"
      submit-label="Save Settings"
      @submit="saveSettings"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Server URL -->
        <FormField
          id="url"
          label="NATS Server URL"
          :required="true"
          help-text="WebSocket URL (ws:// or wss://)"
          class="md:col-span-2"
        >
          <InputText
            id="url"
            v-model="config.url"
            placeholder="ws://localhost:8080"
            class="w-full"
            :disabled="isConnected"
          />
        </FormField>
        
        <!-- Authentication Section -->
        <div class="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
          <h3 class="text-lg font-medium mb-3">Authentication</h3>
        </div>
        
        <!-- Username -->
        <FormField
          id="user"
          label="Username"
          :required="!config.token"
          hint="Required if token is not provided"
        >
          <InputText
            id="user"
            v-model="config.user"
            placeholder="Username"
            class="w-full"
            :disabled="isConnected || !!config.token"
          />
        </FormField>
        
        <!-- Password -->
        <FormField
          id="pass"
          label="Password"
          :required="!config.token"
          hint="Required if token is not provided"
        >
          <Password
            id="pass"
            v-model="config.pass"
            placeholder="Password"
            toggleMask
            class="w-full"
            :feedback="false"
            :disabled="isConnected || !!config.token"
          />
        </FormField>
        
        <!-- Token -->
        <FormField
          id="token"
          label="Token"
          :required="!config.user || !config.pass"
          hint="Alternative to username/password"
          class="md:col-span-2"
        >
          <Password
            id="token"
            v-model="config.token"
            placeholder="Authentication token"
            toggleMask
            class="w-full"
            :feedback="false"
            :disabled="isConnected || (!!config.user && !!config.pass)"
          />
        </FormField>
        
        <!-- Options Section -->
        <div class="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
          <h3 class="text-lg font-medium mb-3">Options</h3>
        </div>
        
        <!-- Auto Connect -->
        <FormField
          id="autoConnect"
          label="Auto Connect"
          class="md:col-span-2"
        >
          <div class="flex items-center">
            <InputSwitch
              id="autoConnect"
              v-model="config.autoConnect"
              class="mr-2"
            />
            <label for="autoConnect" class="cursor-pointer">
              Automatically connect on application startup
            </label>
          </div>
        </FormField>

        <!-- TOPICS SECTION - NEW -->
        <div class="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
          <h3 class="text-lg font-medium mb-3">Subscription Topics</h3>
        </div>
        
        <!-- Topic List -->
        <div class="md:col-span-2 p-4 border border-gray-200 rounded-lg">
          <div v-if="config.subjects && config.subjects.length === 0" class="text-gray-500 text-center py-4">
            No subscription topics configured
          </div>
          
          <ul v-else class="space-y-2">
            <li v-for="(topic, index) in config.subjects" :key="index" class="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
              <span class="font-mono text-sm">{{ topic }}</span>
              <Button 
                icon="pi pi-times" 
                class="p-button-text p-button-rounded p-button-sm" 
                @click="removeTopic(index)"
                :disabled="isConnected"
              />
            </li>
          </ul>
          
          <!-- Add Topic Form -->
          <div class="flex mt-4 gap-2">
            <InputText
              v-model="newTopic"
              placeholder="Enter topic (e.g. sensors.temperature)"
              class="flex-1"
              :disabled="isConnected"
            />
            <Button
              icon="pi pi-plus"
              @click="addTopic"
              :disabled="!isValidTopic || isConnected"
            />
          </div>
          <small class="text-gray-500 mt-1 block">
            Topic patterns like "sensors.*" or "building.>" are supported
          </small>
        </div>
      </div>
      
      <!-- Connection Buttons -->
      <div class="flex justify-between mt-6">
        <div>
          <Button
            type="button"
            :label="isConnected ? 'Disconnect' : 'Connect'"
            :icon="isConnected ? 'pi pi-power-off' : 'pi pi-link'"
            :class="isConnected ? 'p-button-danger' : 'p-button-success'"
            :loading="loading"
            @click="toggleConnection"
          />
          
          <Button
            type="button"
            label="Reset"
            icon="pi pi-refresh"
            class="p-button-outlined ml-2"
            :disabled="loading || isConnected"
            @click="resetSettings"
          />
        </div>
        
        <Button
          type="submit"
          label="Save Settings"
          icon="pi pi-save"
          :disabled="loading"
        />
      </div>
    </EntityForm>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import EntityForm from '../../components/common/EntityForm.vue';
import FormField from '../../components/common/FormField.vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';

// Import the NATS services
import natsConnectionManager from '../../services/nats/natsConnectionManager';
import { natsConfigService } from '../../services/nats/natsConfigService';
import natsService from '../../services/nats/natsService';

// Import topic validator
import { validateTopic } from '../../services/topic-permission/topicPermissionService';

// Get toast functionality for notifications
const toast = useToast();

// Local state
const config = ref(natsConfigService.getDefaultConfig());
const connectionStatus = ref('disconnected');
const errorMessage = ref('');
const loading = ref(false);
const statusListener = ref(null);
const newTopic = ref(''); // NEW: for adding topics

// Load configuration on mount
onMounted(() => {
  // Get current configuration
  config.value = natsConfigService.getConfig();
  
  // Ensure subjects array exists
  if (!config.value.subjects) {
    config.value.subjects = [];
  }
  
  // Set up status listener
  statusListener.value = (status, error) => {
    connectionStatus.value = status;
    errorMessage.value = error;
  };
  natsService.onStatusChange(statusListener.value);
  
  // Initialize with current connection status
  connectionStatus.value = natsService.status;
});

// Clean up on unmount
onUnmounted(() => {
  if (statusListener.value) {
    natsService.removeStatusListener(statusListener.value);
  }
});

// Status display helpers
const statusClass = computed(() => {
  if (isConnected.value) return 'bg-green-100 text-green-800';
  if (isConnecting.value) return 'bg-blue-100 text-blue-800';
  if (hasError.value) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
});

const statusIndicatorClass = computed(() => {
  if (isConnected.value) return 'bg-green-500';
  if (isConnecting.value) return 'bg-blue-500';
  if (hasError.value) return 'bg-red-500';
  return 'bg-gray-500';
});

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'Connected to NATS server';
    case 'connecting': return 'Connecting to NATS server...';
    case 'error': return 'Connection error';
    default: return 'Disconnected';
  }
});

// NEW: Check if topic is valid
const isValidTopic = computed(() => {
  return newTopic.value && validateTopic(newTopic.value);
});

// Computed properties
const isConnected = computed(() => connectionStatus.value === 'connected');
const isConnecting = computed(() => connectionStatus.value === 'connecting');
const hasError = computed(() => connectionStatus.value === 'error');

// Toggle connection state
const toggleConnection = async () => {
  loading.value = true;
  
  try {
    if (isConnected.value) {
      // Disconnect
      await natsConnectionManager.disconnect();
      toast.add({
        severity: 'info',
        summary: 'Disconnected',
        detail: 'Disconnected from NATS server',
        life: 3000
      });
    } else {
      // Validate config before connecting
      const validation = natsConfigService.validateConfig(config.value);
      if (!validation.valid) {
        toast.add({
          severity: 'error',
          summary: 'Invalid Configuration',
          detail: validation.errors.join('. '),
          life: 5000
        });
        return;
      }
      
      // Connect
      const success = await natsConnectionManager.connect(config.value);
      
      if (success) {
        toast.add({
          severity: 'success',
          summary: 'Connected',
          detail: `Successfully connected to NATS server at ${config.value.url}`,
          life: 3000
        });
      } else {
        toast.add({
          severity: 'error',
          summary: 'Connection Failed',
          detail: errorMessage.value || 'Failed to connect to NATS server',
          life: 5000
        });
      }
    }
  } finally {
    loading.value = false;
  }
};

// Save settings
const saveSettings = () => {
  natsConfigService.saveConfig(config.value);
  
  toast.add({
    severity: 'success',
    summary: 'Settings Saved',
    detail: 'NATS configuration has been saved',
    life: 3000
  });
};

// Reset settings
const resetSettings = () => {
  config.value = natsConfigService.getDefaultConfig();
  
  toast.add({
    severity: 'info',
    summary: 'Settings Reset',
    detail: 'NATS configuration has been reset to defaults',
    life: 3000
  });
};

// NEW: Add a subscription topic
const addTopic = () => {
  // Skip if empty or invalid
  if (!newTopic.value || !validateTopic(newTopic.value)) return;
  
  // Ensure subjects array exists
  if (!config.value.subjects) {
    config.value.subjects = [];
  }
  
  // Skip if already exists
  if (config.value.subjects.includes(newTopic.value)) {
    toast.add({
      severity: 'warn',
      summary: 'Duplicate Topic',
      detail: 'This topic is already in the list',
      life: 3000
    });
    return;
  }
  
  // Add to list
  config.value.subjects.push(newTopic.value);
  
  // Clear input
  newTopic.value = '';
  
  // Save changes
  saveSettings();
};

// NEW: Remove a subscription topic
const removeTopic = (index) => {
  // Remove topic at index
  config.value.subjects.splice(index, 1);
  
  // Save changes
  saveSettings();
};
</script>
