// src/composables/useNatsSettings.js
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import natsService from '../services/nats/natsService';
import { natsConfigService } from '../services/nats/natsConfigService';
import { useApiOperation } from './useApiOperation';

/**
 * Composable for NATS settings and connection management
 */
export function useNatsSettings() {
  const toast = useToast();
  const { performOperation } = useApiOperation();
  
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
    
    return performOperation(
      () => natsService.connect(config.value),
      {
        loadingRef: loading,
        errorRef: null, // NATS service already tracks error state
        errorMessage: 'Failed to connect to NATS server',
        successMessage: `Successfully connected to NATS server at ${config.value.url}`,
        onSuccess: (success) => success,
        onError: () => false
      }
    );
  };
  
  // Disconnect from NATS server
  const disconnectFromNats = async () => {
    return performOperation(
      () => natsService.disconnect(),
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: 'Error disconnecting from NATS',
        successMessage: 'Disconnected from NATS server',
        onSuccess: () => true,
        onError: () => false
      }
    );
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
