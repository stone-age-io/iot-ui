// src/composables/useNatsSettings.js
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import natsService from '../services/nats/natsService';
import { natsConfigService } from '../services/nats/natsConfigService';

/**
 * Composable for NATS settings and connection management
 */
export function useNatsSettings() {
  const toast = useToast();
  
  // Settings state
  const config = ref(natsConfigService.getDefaultConfig());
  const connectionStatus = ref('disconnected');
  const errorMessage = ref('');
  const loading = ref(false);
  
  // Initialize from localStorage
  const initSettings = () => {
    config.value = natsConfigService.getConfig();
    
    // Subscribe to status changes
    natsService.onStatusChange((status, error) => {
      connectionStatus.value = status;
      errorMessage.value = error;
      
      // Only show error messages via toast (removed success toast here)
      if (status === 'error' && error) {
        toast.add({
          severity: 'error',
          summary: 'Connection Error',
          detail: error,
          life: 5000
        });
      }
    });
    
    // Auto-connect if configured
    if (config.value.autoConnect) {
      connectToNats();
    }
  };
  
  // Connect to NATS server
  const connectToNats = async () => {
    // Validate config
    const validation = natsConfigService.validateConfig(config.value);
    if (!validation.valid) {
      toast.add({
        severity: 'error',
        summary: 'Invalid Configuration',
        detail: validation.errors.join('. '),
        life: 5000
      });
      return false;
    }
    
    loading.value = true;
    try {
      const success = await natsService.connect(config.value);
      
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
      
      return success;
    } finally {
      loading.value = false;
    }
  };
  
  // Disconnect from NATS server
  const disconnectFromNats = async () => {
    loading.value = true;
    try {
      await natsService.disconnect();
      
      toast.add({
        severity: 'info',
        summary: 'Disconnected',
        detail: 'Disconnected from NATS server',
        life: 3000
      });
      
      return true;
    } finally {
      loading.value = false;
    }
  };
  
  // Save NATS configuration
  const saveSettings = () => {
    natsConfigService.saveConfig(config.value);
    
    toast.add({
      severity: 'success',
      summary: 'Settings Saved',
      detail: 'NATS configuration has been saved',
      life: 3000
    });
    
    return true;
  };
  
  // Reset to default settings
  const resetSettings = () => {
    config.value = natsConfigService.getDefaultConfig();
    
    toast.add({
      severity: 'info',
      summary: 'Settings Reset',
      detail: 'NATS configuration has been reset to defaults',
      life: 3000
    });
  };
  
  // Computed properties
  const isConnected = computed(() => connectionStatus.value === 'connected');
  const isConnecting = computed(() => connectionStatus.value === 'connecting');
  const hasError = computed(() => connectionStatus.value === 'error');
  
  // Initialize on composition API setup
  onMounted(() => {
    initSettings();
  });
  
  return {
    // State
    config,
    connectionStatus,
    errorMessage,
    loading,
    
    // Computed
    isConnected,
    isConnecting,
    hasError,
    
    // Methods
    initSettings,
    connectToNats,
    disconnectFromNats,
    saveSettings,
    resetSettings
  };
}
