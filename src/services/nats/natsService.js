// src/services/nats/natsService.js
import { connect } from 'nats.ws';

class NatsService {
  constructor() {
    this.connection = null;
    this.status = 'disconnected'; // disconnected, connecting, connected, error
    this.statusListeners = [];
    this.errorMessage = '';
    this.subscriptions = new Map(); // Track active subscriptions
    this.nextSubscriptionId = 1; // Used to generate unique subscription IDs
    this.topicSubscriptions = new Map(); // Track subscriptions by topic
    this.connectingPromise = null; // Track current connection attempt
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
    // If already connected, return true
    if (this.status === 'connected') {
      return true;
    }
    
    // If currently connecting, wait for that attempt to finish
    if (this.status === 'connecting' && this.connectingPromise) {
      return this.connectingPromise;
    }
    
    try {
      this.setStatus('connecting');
      
      // Store the promise to prevent duplicate connection attempts
      this.connectingPromise = (async () => {
        try {
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
          
          // Setup disconnect handler
          this.setupStatusHandler();
          
          return true;
        } catch (error) {
          this.setStatus('error', error.message);
          return false;
        } finally {
          this.connectingPromise = null;
        }
      })();
      
      return await this.connectingPromise;
    } catch (error) {
      this.setStatus('error', error.message);
      this.connectingPromise = null;
      return false;
    }
  }

  /**
   * Setup the NATS status handler
   */
  setupStatusHandler() {
    if (!this.connection) return;
    
    // Setup disconnect handler
    (async () => {
      for await (const status of this.connection.status()) {
        if (status.type === 'disconnect') {
          this.setStatus('disconnected');
        } else if (status.type === 'reconnect') {
          this.setStatus('connected');
        } else if (status.type === 'error') {
          this.setStatus('error', status.data ? status.data.message : 'Connection error');
        }
      }
    })().catch((err) => {
      // Error in status handler
    });
  }

  /**
   * Disconnect from NATS server
   */
  async disconnect() {
    if (this.connection) {
      try {
        // First, unsubscribe from all active subscriptions
        for (const subscription of this.subscriptions.values()) {
          try {
            await subscription.unsubscribe();
          } catch (subError) {
            // Error unsubscribing during disconnect
          }
        }
        
        // Clear subscriptions maps
        this.subscriptions.clear();
        this.topicSubscriptions.clear();
        
        // Now close the connection
        await this.connection.close();
      } catch (error) {
        // Error disconnecting from NATS
      } finally {
        this.connection = null;
        this.setStatus('disconnected');
        this.connectingPromise = null;
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
      return true;
    } catch (error) {
      this.setStatus('error', `Failed to publish: ${error.message}`);
      return false;
    }
  }

  /**
   * Subscribe to a NATS subject
   * @param {string} subject - NATS subject to subscribe to
   * @param {Function} callback - Callback function for received messages
   * @returns {Object|null} - Enhanced subscription object or null on failure
   */
  async subscribe(subject, callback) {
    if (!this.connection) {
      return null;
    }

    // Check if we already have an active subscription for this subject
    if (this.topicSubscriptions.has(subject)) {
      const existingSub = this.topicSubscriptions.get(subject);
      // Return the existing subscription
      return existingSub;
    }

    try {
      // Create subscription
      const subscription = this.connection.subscribe(subject);
      
      // Generate a unique ID for this subscription
      const subscriptionId = this.nextSubscriptionId++;
      
      // Store the ID on the subscription object
      subscription.sid = subscriptionId;
      
      // Store subscription with ID as key
      this.subscriptions.set(subscriptionId, subscription);
      
      // Store subscription with subject as key
      this.topicSubscriptions.set(subject, subscription);
      
      // Start message handler
      (async () => {
        try {
          for await (const message of subscription) {
            try {
              // First check if subscription is still active
              if (!this.subscriptions.has(subscriptionId)) {
                break;
              }
              
              let data;
              try {
                data = JSON.parse(new TextDecoder().decode(message.data));
              } catch (parseError) {
                data = new TextDecoder().decode(message.data);
              }
              
              callback(data, message.subject, subscriptionId);
            } catch (messageError) {
              // Error processing message
            }
          }
        } catch (subscriptionError) {
          // Error in subscription handler
        } finally {
          // Clean up when subscription ends
          this.subscriptions.delete(subscriptionId);
          this.topicSubscriptions.delete(subject);
        }
      })();
      
      return subscription;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update connection status and notify listeners
   * @param {string} status - New status
   * @param {string} errorMessage - Optional error message
   */
  setStatus(status, errorMessage = '') {
    // Skip if no change
    if (this.status === status && this.errorMessage === errorMessage) {
      return;
    }
    
    // Update status
    this.status = status;
    this.errorMessage = errorMessage;
    
    // Notify all status listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(status, errorMessage);
      } catch (error) {
        // Error in status listener
      }
    });
  }

  /**
   * Add a connection status listener
   * @param {Function} listener - Status change listener
   */
  onStatusChange(listener) {
    // Prevent duplicate listeners
    if (!this.statusListeners.includes(listener)) {
      this.statusListeners.push(listener);
      // Immediately invoke with current status
      listener(this.status, this.errorMessage);
    }
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
   * Get subscription by subject
   * @param {string} subject - Subject to lookup
   * @returns {Object|undefined} - Subscription object if found
   */
  getSubscriptionBySubject(subject) {
    return this.topicSubscriptions.get(subject);
  }
  
  /**
   * Unsubscribe from a subject
   * @param {Object} subscription - Subscription object to unsubscribe
   */
  async unsubscribe(subscription) {
    if (subscription) {
      try {
        // Only unsubscribe if this is a valid subscription
        if (typeof subscription.unsubscribe === 'function') {
          await subscription.unsubscribe();
        }
        
        // Remove from tracked subscriptions
        if (subscription.sid) {
          this.subscriptions.delete(subscription.sid);
        }
        
        // Remove from topic subscriptions map
        this.topicSubscriptions.forEach((sub, topic) => {
          if (sub === subscription) {
            this.topicSubscriptions.delete(topic);
          }
        });
      } catch (error) {
        // Error unsubscribing
      }
    }
  }
  
  /**
   * Generate a test message for debugging
   * @param {string} topic - Topic to publish to
   * @param {Object} data - Message data
   */
  generateTestMessage(topic = 'test', data = { test: 'message', timestamp: new Date().toISOString() }) {
    if (!this.isConnected()) {
      return false;
    }
    
    try {
      this.publish(topic, data);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const natsService = new NatsService();
export default natsService;
