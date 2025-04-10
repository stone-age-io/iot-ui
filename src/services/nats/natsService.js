// src/services/nats/natsService.js
import { connect } from 'nats.ws';

class NatsService {
  constructor() {
    this.connection = null;
    this.status = 'disconnected'; // disconnected, connecting, connected, error
    this.statusListeners = [];
    this.errorMessage = '';
    this.subscriptions = new Map(); // Track active subscriptions
  }

  /**
   * Connect to NATS server using WebSocket
   * @param {Object} config - Connection configuration
   * @param {string} config.url - NATS WebSocket URL (e.g., ws://localhost:8080)
   * @param {string} config.user - NATS username
   * @param {string} config.pass - NATS password
   * @param {boolean} config.token - NATS token (alternative to user/pass)
   * @returns {Promise<boolean>} - Connection success
   */
  async connect(config) {
    try {
      this.setStatus('connecting');
      
      // Build connection options
      const options = {
        servers: config.url,
      };
      
      // Add authentication if provided
      if (config.user && config.pass) {
        options.user = config.user;
        options.pass = config.pass;
      } else if (config.token) {
        options.token = config.token;
      }

      // Connect to NATS
      this.connection = await connect(options);
      
      this.setStatus('connected');
      console.log('Connected to NATS server');
      
      // Setup disconnect handler
      (async () => {
        for await (const status of this.connection.status()) {
          console.log(`NATS connection status: ${status.type}`);
          if (status.type === 'disconnect') {
            this.setStatus('disconnected');
          } else if (status.type === 'reconnect') {
            this.setStatus('connected');
          } else if (status.type === 'error') {
            this.setStatus('error', status.data ? status.data.message : 'Connection error');
          }
        }
      })().catch((err) => {
        console.error('Error in NATS status handler:', err);
      });
      
      return true;
    } catch (error) {
      this.setStatus('error', error.message);
      console.error('Failed to connect to NATS:', error);
      return false;
    }
  }

  /**
   * Disconnect from NATS server
   */
  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.close();
        console.log('Disconnected from NATS server');
      } catch (error) {
        console.error('Error disconnecting from NATS:', error);
      } finally {
        this.connection = null;
        this.setStatus('disconnected');
      }
    }
  }

  /**
   * Publish a message to a NATS subject
   * @param {string} subject - NATS subject to publish to
   * @param {Object} message - Message to publish (will be JSON stringified)
   * @returns {Promise<boolean>} - Publish success
   */
  async publish(subject, message) {
    if (!this.connection) {
      this.setStatus('error', 'Not connected to NATS server');
      return false;
    }

    try {
      const jsonData = JSON.stringify(message);
      
      // Publish message
      this.connection.publish(subject, jsonData);
      console.log(`Published to ${subject}:`, message);
      return true;
    } catch (error) {
      console.error('Error publishing message:', error);
      this.setStatus('error', `Failed to publish: ${error.message}`);
      return false;
    }
  }

  /**
   * Subscribe to a NATS subject
   * @param {string} subject - NATS subject to subscribe to
   * @param {Function} callback - Callback function for received messages
   * @returns {Object|null} - Subscription object or null on failure
   */
  async subscribe(subject, callback) {
    if (!this.connection) {
      this.setStatus('error', 'Not connected to NATS server');
      return null;
    }

    try {
      // Create subscription
      const subscription = this.connection.subscribe(subject);
      
      // Store subscription with subject as key
      this.subscriptions.set(subject, subscription);
      
      // Start message handler
      (async () => {
        for await (const message of subscription) {
          try {
            const data = JSON.parse(new TextDecoder().decode(message.data));
            callback(data, message.subject);
          } catch (error) {
            console.error('Error parsing message:', error);
            callback(new TextDecoder().decode(message.data), message.subject);
          }
        }
      })().catch((err) => {
        console.error('Error in subscription handler:', err);
      });
      
      console.log(`Subscribed to ${subject}`);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      this.setStatus('error', `Failed to subscribe: ${error.message}`);
      return null;
    }
  }

  /**
   * Update connection status and notify listeners
   * @param {string} status - New status
   * @param {string} errorMessage - Optional error message
   */
  setStatus(status, errorMessage = '') {
    this.status = status;
    this.errorMessage = errorMessage;
    
    // Notify all status listeners
    this.statusListeners.forEach(listener => {
      listener(status, errorMessage);
    });
  }

  /**
   * Add a connection status listener
   * @param {Function} listener - Status change listener
   */
  onStatusChange(listener) {
    this.statusListeners.push(listener);
    // Immediately invoke with current status
    listener(this.status, this.errorMessage);
  }

  /**
   * Remove a connection status listener
   * @param {Function} listener - Status change listener to remove
   */
  removeStatusListener(listener) {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  /**
   * Check if connected to NATS server
   * @returns {boolean} - Connected status
   */
  isConnected() {
    return this.status === 'connected';
  }
  
  /**
   * Get all active subscriptions
   * @returns {Map} - Map of active subscriptions
   */
  getSubscriptions() {
    return this.subscriptions;
  }
  
  /**
   * Unsubscribe from a subject
   * @param {Object} subscription - Subscription object to unsubscribe
   */
  async unsubscribe(subscription) {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        // Remove from tracked subscriptions
        this.subscriptions.forEach((sub, key) => {
          if (sub === subscription) {
            this.subscriptions.delete(key);
          }
        });
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    }
  }
}

// Create singleton instance
const natsService = new NatsService();
export default natsService;
