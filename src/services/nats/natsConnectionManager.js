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
  }

  /**
   * Initialize the NATS connection manager
   * Called once at application startup
   */
  initialize() {
    if (this.initialized) return;
    
    console.log('Initializing NATS Connection Manager');
    this.initialized = true;
    
    // Listen for connection status changes
    natsService.onStatusChange((status) => {
      console.log(`NATS connection status changed: ${status}`);
      
      // If we get disconnected unexpectedly and auto-connect is enabled,
      // try to reconnect
      if (status === 'disconnected' && !this.isManualDisconnect) {
        this.attemptAutoReconnect();
      }
    });
    
    // When a user logs in, attempt to connect if auto-connect is enabled
    this.attemptAutoConnect();
    
    // Add storage event listener to synchronize across tabs
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  /**
   * Attempt to establish a connection if auto-connect is enabled
   */
  attemptAutoConnect() {
    // Only attempt auto-connect once per session
    if (this.autoConnectAttempted) return;
    
    const config = natsConfigService.getConfig();
    if (config.autoConnect) {
      console.log('Auto-connect enabled, attempting to connect to NATS');
      this.autoConnectAttempted = true;
      this.isManualDisconnect = false;
      natsService.connect(config).catch(err => {
        console.error('Auto-connect failed:', err);
      });
    }
  }

  /**
   * Attempt to reconnect if disconnected unexpectedly
   */
  attemptAutoReconnect() {
    const config = natsConfigService.getConfig();
    if (config.autoConnect && !this.isManualDisconnect) {
      console.log('Attempting to reconnect to NATS');
      natsService.connect(config).catch(err => {
        console.error('Auto-reconnect failed:', err);
      });
    }
  }

  /**
   * Manually connect to NATS with given configuration
   * @param {Object} config - Connection configuration
   * @returns {Promise<boolean>} - Connection success
   */
  async connect(config) {
    this.isManualDisconnect = false;
    return natsService.connect(config);
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
   * Handle localStorage changes to synchronize state across tabs
   * @param {StorageEvent} event - Storage event
   */
  handleStorageChange(event) {
    if (event.key === 'nats_config') {
      console.log('NATS config changed in another tab');
      const newConfig = natsConfigService.getConfig();
      
      // If auto-connect setting changed to true and we're not connected,
      // attempt to connect
      if (newConfig.autoConnect && 
          !natsService.isConnected() && 
          !this.isManualDisconnect) {
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
}

// Create singleton instance
const natsConnectionManager = new NatsConnectionManager();
export default natsConnectionManager;
