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
import { computed } from 'vue';
import { useNatsSettings } from '../../composables/useNatsSettings';
import EntityForm from '../../components/common/EntityForm.vue';
import FormField from '../../components/common/FormField.vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';

// Get NATS settings functionality
const { 
  config, 
  connectionStatus, 
  errorMessage, 
  loading,
  isConnected,
  isConnecting,
  hasError,
  connectToNats,
  disconnectFromNats,
  saveSettings: saveNatsSettings,
  resetSettings: resetNatsConfig
} = useNatsSettings();

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

// Toggle connection state
const toggleConnection = () => {
  if (isConnected.value) {
    disconnectFromNats();
  } else {
    connectToNats();
  }
};

// Save settings
const saveSettings = () => {
  saveNatsSettings();
};

// Reset settings
const resetSettings = () => {
  resetNatsConfig();
};
</script>
