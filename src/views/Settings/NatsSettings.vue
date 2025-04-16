<template>
  <div class="nats-settings">
    <!-- Connection Status -->
    <div 
      class="mb-6 p-4 rounded-lg border flex items-start"
      :class="[statusBackgroundClass, statusBorderClass]"
    >
      <i :class="['pi text-lg mr-3 mt-0.5', statusIconClass]"></i>
      <div class="flex-1">
        <div class="font-medium" :class="statusTextClass">
          {{ statusTitle }}
        </div>
        <div class="text-sm mt-1" :class="statusTextClass">
          {{ statusText }}
        </div>
        <div v-if="errorMessage" class="mt-2 text-sm text-red-700 dark:text-red-400">
          {{ errorMessage }}
        </div>
      </div>
    </div>
    
    <!-- NATS Configuration Form -->
    <EntityForm
      :loading="loading"
      submit-label="Save Settings"
      @submit="saveSettings"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Server URL -->
        <FormField
          id="url"
          label="NATS Server URL"
          :required="true"
          help-text="WebSocket URL (ws:// or wss://)"
          class="md:col-span-2"
          :error-message="urlError"
        >
          <InputText
            id="url"
            v-model="config.url"
            placeholder="ws://localhost:8080"
            class="w-full form-input"
            :disabled="isConnected"
            :class="{ 'p-invalid': urlError }"
          />
        </FormField>
        
        <!-- Authentication Section -->
        <div class="md:col-span-2 mt-2">
          <h3 :class="['text-lg font-medium mb-3 pb-2 border-b', borderColor.default, textColor.primary]">
            Authentication
          </h3>
        </div>
        
        <!-- Username -->
        <FormField
          id="user"
          label="Username"
          :required="!config.token"
          hint="Required if token is not provided"
          :error-message="userError"
        >
          <InputText
            id="user"
            v-model="config.user"
            placeholder="Username"
            class="w-full form-input"
            :disabled="isConnected || !!config.token"
            :class="{ 'p-invalid': userError }"
          />
        </FormField>
        
        <!-- Password -->
        <FormField
          id="pass"
          label="Password"
          :required="!config.token"
          hint="Required if token is not provided"
          :error-message="passError"
        >
          <Password
            id="pass"
            v-model="config.pass"
            placeholder="Password"
            toggleMask
            class="w-full"
            :inputClass="['form-input', { 'p-invalid': passError }]"
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
          :error-message="tokenError"
        >
          <Password
            id="token"
            v-model="config.token"
            placeholder="Authentication token"
            toggleMask
            class="w-full"
            :inputClass="['form-input', { 'p-invalid': tokenError }]"
            :feedback="false"
            :disabled="isConnected || (!!config.user && !!config.pass)"
          />
        </FormField>
        
        <!-- Options Section -->
        <div class="md:col-span-2 mt-2">
          <h3 :class="['text-lg font-medium mb-3 pb-2 border-b', borderColor.default, textColor.primary]">
            Options
          </h3>
        </div>
        
        <!-- Auto Connect -->
        <FormField
          id="autoConnect"
          label="Auto Connect"
          class="md:col-span-2"
        >
          <div class="flex items-center mt-2">
            <InputSwitch
              id="autoConnect"
              v-model="config.autoConnect"
              class="mr-2"
            />
            <label 
              for="autoConnect"
              class="cursor-pointer"
              :class="textColor.primary"
            >
              Automatically connect on application startup
            </label>
          </div>
        </FormField>

        <!-- TOPICS SECTION -->
        <div class="md:col-span-2 mt-2">
          <h3 :class="['text-lg font-medium mb-3 pb-2 border-b', borderColor.default, textColor.primary]">
            Subscription Topics
          </h3>
        </div>
        
        <!-- Topic List -->
        <div 
          class="md:col-span-2 p-4 rounded-lg"
          :class="[borderColor.default, backgroundColor.secondary]"
        >
          <!-- Empty State -->
          <div 
            v-if="!config.subjects || config.subjects.length === 0" 
            class="text-center py-6 empty-state"
            :class="textColor.secondary"
          >
            <i class="pi pi-th-large text-2xl mb-2 block"></i>
            <p>No subscription topics configured</p>
            <p class="text-sm mt-1">Add topics to receive NATS messages</p>
          </div>
          
          <!-- Topic List -->
          <ul v-else class="space-y-2 mb-4">
            <li 
              v-for="(topic, index) in config.subjects" 
              :key="index" 
              class="flex justify-between items-center p-2 rounded-md"
              :class="backgroundColor.hover"
            >
              <div class="flex items-center">
                <i class="pi pi-hashtag mr-2 text-blue-500 dark:text-blue-400"></i>
                <span class="font-mono text-sm" :class="textColor.primary">{{ topic }}</span>
              </div>
              <Button 
                icon="pi pi-times" 
                class="p-button-text p-button-rounded p-button-sm" 
                @click="removeTopic(index)"
                :disabled="isConnected"
              />
            </li>
          </ul>
          
          <!-- Add Topic Form -->
          <div class="flex gap-2">
            <div class="flex-1">
              <InputText
                v-model="newTopic"
                placeholder="Enter topic (e.g. sensors.temperature)"
                class="w-full"
                :disabled="isConnected"
                :class="{ 'p-invalid': topicError }"
                @keyup.enter="addTopic"
              />
              <small 
                v-if="topicError" 
                class="p-error block mt-1"
              >{{ topicError }}</small>
              <small v-else :class="['mt-1 block', textColor.secondary]">
                Topic patterns like "sensors.*" or "building.>" are supported
              </small>
            </div>
            <Button
              icon="pi pi-plus"
              @click="addTopic"
              :disabled="!isValidTopic || isConnected"
              class="align-self-start"
            />
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex flex-wrap justify-end gap-3 mt-6">
        <Button
          type="button"
          label="Reset to Defaults"
          icon="pi pi-refresh"
          class="p-button-outlined p-button-secondary"
          :disabled="loading || isConnected || actionLoading"
          @click="resetSettings"
        />
        
        <Button
          type="button"
          :label="isConnected ? 'Disconnect' : 'Connect'"
          :icon="isConnected ? 'pi pi-power-off' : 'pi pi-link'"
          :class="isConnected ? 'p-button-danger' : 'p-button-success'"
          :loading="actionLoading"
          @click="toggleConnection"
        />
      </div>
    </EntityForm>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useTheme } from '../../composables/useTheme';
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

// Theme composable for theme-aware styling
const { themeValue, textColor, backgroundColor, borderColor } = useTheme();

// Get toast functionality for notifications
const toast = useToast();

// Local state
const config = ref(natsConfigService.getDefaultConfig());
const connectionStatus = ref('disconnected');
const errorMessage = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const statusListener = ref(null);
const newTopic = ref('');
const topicError = ref('');

// Form validation errors
const urlError = ref('');
const userError = ref('');
const passError = ref('');
const tokenError = ref('');

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
const statusBackgroundClass = computed(() => {
  if (isConnected.value) return 'bg-green-50 dark:bg-green-900/20';
  if (isConnecting.value) return 'bg-blue-50 dark:bg-blue-900/20';
  if (hasError.value) return 'bg-red-50 dark:bg-red-900/20';
  return 'bg-gray-50 dark:bg-gray-800';
});

const statusBorderClass = computed(() => {
  if (isConnected.value) return 'border-green-200 dark:border-green-800';
  if (isConnecting.value) return 'border-blue-200 dark:border-blue-800';
  if (hasError.value) return 'border-red-200 dark:border-red-800';
  return 'border-gray-200 dark:border-gray-700';
});

const statusIconClass = computed(() => {
  if (isConnected.value) return 'pi-check-circle text-green-500 dark:text-green-400';
  if (isConnecting.value) return 'pi-sync text-blue-500 dark:text-blue-400';
  if (hasError.value) return 'pi-times-circle text-red-500 dark:text-red-400';
  return 'pi-power-off text-gray-500 dark:text-gray-400';
});

const statusTextClass = computed(() => {
  if (isConnected.value) return 'text-green-700 dark:text-green-300';
  if (isConnecting.value) return 'text-blue-700 dark:text-blue-300';
  if (hasError.value) return 'text-red-700 dark:text-red-300';
  return textColor.primary;
});

const statusTitle = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'Connected to NATS server';
    case 'connecting': return 'Connecting to NATS server...';
    case 'error': return 'Connection error';
    default: return 'Disconnected';
  }
});

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': 
      return `Successfully connected to ${config.value.url}`;
    case 'connecting': 
      return 'Attempting to establish connection...';
    case 'error': 
      return errorMessage.value || 'Failed to connect to NATS server';
    default: 
      return 'Not connected to any NATS server';
  }
});

// Check if topic is valid
const isValidTopic = computed(() => {
  return newTopic.value.trim() && validateTopic(newTopic.value.trim()) && !topicError.value;
});

// Watch for topic input changes to validate
watch(newTopic, (value) => {
  if (!value.trim()) {
    topicError.value = '';
    return;
  }
  
  if (!validateTopic(value.trim())) {
    topicError.value = 'Invalid topic format';
  } else if (config.value.subjects && config.value.subjects.includes(value.trim())) {
    topicError.value = 'Topic already exists';
  } else {
    topicError.value = '';
  }
});

// Computed properties
const isConnected = computed(() => connectionStatus.value === 'connected');
const isConnecting = computed(() => connectionStatus.value === 'connecting');
const hasError = computed(() => connectionStatus.value === 'error');

// Validate the form
const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  urlError.value = '';
  userError.value = '';
  passError.value = '';
  tokenError.value = '';
  
  // Validate URL
  if (!config.value.url) {
    urlError.value = 'Server URL is required';
    isValid = false;
  } else if (!config.value.url.startsWith('ws://') && !config.value.url.startsWith('wss://')) {
    urlError.value = 'URL must start with ws:// or wss://';
    isValid = false;
  }
  
  // Validate authentication
  if (!config.value.token) {
    // If no token, username and password are required
    if (!config.value.user) {
      userError.value = 'Username is required when not using a token';
      isValid = false;
    }
    
    if (!config.value.pass) {
      passError.value = 'Password is required when not using a token';
      isValid = false;
    }
  } else if (config.value.user || config.value.pass) {
    tokenError.value = 'Cannot use both token and username/password';
    isValid = false;
  }
  
  return isValid;
};

// Toggle connection state
const toggleConnection = async () => {
  actionLoading.value = true;
  
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
      if (!validateForm()) {
        toast.add({
          severity: 'error',
          summary: 'Invalid Configuration',
          detail: 'Please fix the errors in the form before connecting',
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
    actionLoading.value = false;
  }
};

// Save settings
const saveSettings = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'error',
      summary: 'Invalid Configuration',
      detail: 'Please fix the errors in the form before saving',
      life: 5000
    });
    return;
  }
  
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
  
  // Reset form errors
  urlError.value = '';
  userError.value = '';
  passError.value = '';
  tokenError.value = '';
  
  toast.add({
    severity: 'info',
    summary: 'Settings Reset',
    detail: 'NATS configuration has been reset to defaults',
    life: 3000
  });
};

// Add a subscription topic
const addTopic = () => {
  // Skip if empty or invalid
  if (!newTopic.value.trim() || !validateTopic(newTopic.value.trim()) || topicError.value) {
    return;
  }
  
  // Ensure subjects array exists
  if (!config.value.subjects) {
    config.value.subjects = [];
  }
  
  // Skip if already exists
  if (config.value.subjects.includes(newTopic.value.trim())) {
    topicError.value = 'Topic already exists';
    return;
  }
  
  // Add to list
  config.value.subjects.push(newTopic.value.trim());
  
  // Clear input
  newTopic.value = '';
  
  // Save changes
  natsConfigService.saveConfig(config.value);
  
  toast.add({
    severity: 'success',
    summary: 'Topic Added',
    detail: 'Subscription topic has been added',
    life: 2000
  });
};

// Remove a subscription topic
const removeTopic = (index) => {
  // Remove topic at index
  config.value.subjects.splice(index, 1);
  
  // Save changes
  natsConfigService.saveConfig(config.value);
  
  toast.add({
    severity: 'info',
    summary: 'Topic Removed',
    detail: 'Subscription topic has been removed',
    life: 2000
  });
};
</script>

<style scoped>
/* Theme-aware styling */
.nats-settings {
  transition: all 0.2s ease;
}

.form-input {
  transition: all 0.2s ease;
}

/* Style for Password component that doesn't properly inherit theme */
:deep(.p-password) {
  width: 100%;
}

:deep(.p-password-input) {
  width: 100%;
}

/* Fix password toggle button styling */
:deep(.p-password-panel) {
  background-color: var(--surface-overlay);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.p-password .p-password-toggle) {
  background: transparent !important;
  border: none !important;
  color: var(--text-color-secondary) !important;
}

:deep(.p-password .p-password-toggle:hover) {
  color: var(--text-color) !important;
}

:deep(.dark .p-password .p-password-toggle) {
  background: transparent !important;
  color: var(--text-color-secondary) !important;
}

:deep(.dark .p-password .p-password-toggle:hover) {
  color: var(--text-color) !important;
}

/* Empty state styling */
.empty-state {
  opacity: 0.7;
}

/* Fix PrimeVue components styling in dark mode */
:deep(.dark .p-inputtext),
:deep(.dark .p-dropdown),
:deep(.dark .p-inputnumber) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-inputtext:enabled:focus) {
  box-shadow: 0 0 0 1px var(--primary-400);
  border-color: var(--primary-400);
}

:deep(.p-invalid.p-inputtext:enabled:focus) {
  box-shadow: 0 0 0 1px var(--red-400);
  border-color: var(--red-400);
}

:deep(.dark .p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  background-color: var(--primary-500);
}

:deep(.dark .p-inputswitch.p-inputswitch-checked:not(.p-disabled):hover .p-inputswitch-slider) {
  background-color: var(--primary-600);
}
</style>
