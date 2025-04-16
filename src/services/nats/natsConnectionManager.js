// src/services/nats/natsConnectionManager.js
import natsService from './natsService';
import { natsConfigService } from './natsConfigService';

/**
 * Global NATS connection manager that handles connection
 * lifecycle across the application
 */
class NatsConnectionManager {
  constructor() {
    this.initialized = false;
    this.autoConnectAttempted = false;
    this.isManualDisconnect = false;
    this.connectPromise = null;
  }

  /**
   * Initialize the NATS connection manager
   * Called once at application startup
   */
  initialize() {
    // Prevent multiple initializations
    if (this.initialized) {
      return;
    }
    
    this.initialized = true;
    
    // Listen for connection status changes
    natsService.onStatusChange((status) => {
      // If we get disconnected unexpectedly and auto-connect is enabled,
      // try to reconnect
      if (status === 'disconnected' && !this.isManualDisconnect) {
        this.attemptAutoReconnect();
      }
    });
    
    // Add storage event listener to synchronize across tabs
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  /**
   * Attempt to establish a connection if auto-connect is enabled
   * @returns {Promise<boolean>} - Whether auto-connect was attempted
   */
  async attemptAutoConnect() {
    // Only attempt auto-connect once per session
    if (this.autoConnectAttempted) {
      return this.connectPromise || Promise.resolve(false);
    }
    
    const config = natsConfigService.getConfig();
    if (config.autoConnect) {
      this.autoConnectAttempted = true;
      this.isManualDisconnect = false;
      
      // Store the connection promise
      this.connectPromise = this.connect(config);
      
      try {
        return await this.connectPromise;
      } catch (err) {
        return false;
      } finally {
        this.connectPromise = null;
      }
    }
    
    // Mark as attempted even if not enabled to prevent repeated checks
    this.autoConnectAttempted = true;
    return false;
  }

  /**
   * Attempt to reconnect if disconnected unexpectedly
   */
  async attemptAutoReconnect() {
    const config = natsConfigService.getConfig();
    if (config.autoConnect && !this.isManualDisconnect) {
      // Store the reconnection promise
      this.connectPromise = natsService.connect(config);
      
      try {
        return await this.connectPromise;
      } catch (err) {
        return false;
      } finally {
        this.connectPromise = null;
      }
    }
    return false;
  }

  /**
   * Manually connect to NATS with given configuration
   * @param {Object} config - Connection configuration
   * @returns {Promise<boolean>} - Connection success
   */
  async connect(config) {
    // If we're already connecting, wait for that to complete
    if (this.connectPromise) {
      return this.connectPromise;
    }
    
    this.isManualDisconnect = false;
    
    // Start the connection and store the promise
    this.connectPromise = natsService.connect(config);
    
    try {
      const result = await this.connectPromise;
      
      // If connection was successful, generate a test message to confirm
      if (result) {
        // Wait a moment to ensure connection is fully established
        setTimeout(() => {
          natsService.generateTestMessage('system.connected', {
            message: 'NATS connection established',
            timestamp: new Date().toISOString(),
            source: 'system'
          });
        }, 1000);
      }
      
      return result;
    } finally {
      this.connectPromise = null;
    }
  }

  /**
   * Manually disconnect from NATS
   * @returns {Promise<void>} - Disconnect promise
   */
  async disconnect() {
    this.isManualDisconnect = true;
    return natsService.disconnect();
  }

  /**
   * Reset the connection state to allow reconnection attempts
   */
  resetConnectionState() {
    this.autoConnectAttempted = false;
    this.isManualDisconnect = false;
    this.connectPromise = null;
  }

  /**
   * Handle localStorage changes to synchronize state across tabs
   * @param {StorageEvent} event - Storage event
   */
  handleStorageChange(event) {
    if (event.key === 'nats_config') {
      const newConfig = natsConfigService.getConfig();
      
      // If auto-connect setting changed to true and we're not connected,
      // attempt to connect
      if (newConfig.autoConnect && 
          !natsService.isConnected() && 
          !this.isManualDisconnect) {
        this.resetConnectionState();
        this.attemptAutoConnect();
      }
    }
  }

  /**
   * Get current connection status
   * @returns {string} - Connection status
   */
  getStatus() {
    return natsService.status;
  }

  /**
   * Check if currently connected
   * @returns {boolean} - Connected status
   */
  isConnected() {
    return natsService.isConnected();
  }
  
  /**
   * Generate a test message to help diagnose subscription issues
   * @returns {boolean} - Whether the message was sent
   */
  sendTestMessage() {
    if (!this.isConnected()) {
      return false;
    }
    
    return natsService.generateTestMessage('test.message', {
      message: 'Test message from NATS Connection Manager',
      timestamp: new Date().toISOString(),
      source: 'system'
    });
  }
}

// Create singleton instance
const natsConnectionManager = new NatsConnectionManager();
export default natsConnectionManager;
