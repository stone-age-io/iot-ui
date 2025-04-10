// src/services/nats/natsConfigService.js
const STORAGE_KEY = 'nats_config';

export class NatsConfigService {
  /**
   * Get NATS configuration from localStorage
   * @returns {Object} - NATS configuration
   */
  getConfig() {
    const configJson = localStorage.getItem(STORAGE_KEY);
    if (configJson) {
      try {
        return JSON.parse(configJson);
      } catch (error) {
        console.error('Error parsing NATS config:', error);
      }
    }
    return this.getDefaultConfig();
  }
  
  /**
   * Save NATS configuration to localStorage
   * @param {Object} config - NATS configuration
   */
  saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
  
  /**
   * Get default NATS configuration
   * @returns {Object} - Default configuration
   */
  getDefaultConfig() {
    return {
      url: 'ws://localhost:8080',
      user: '',
      pass: '',
      token: '',
      autoConnect: false,
      subjects: []  // For future use - saved subscriptions
    };
  }
  
  /**
   * Validate NATS configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} - Validation result {valid: boolean, errors: string[]}
   */
  validateConfig(config) {
    const errors = [];
    
    if (!config.url) {
      errors.push('NATS server URL is required');
    } else if (!config.url.startsWith('ws://') && !config.url.startsWith('wss://')) {
      errors.push('NATS server URL must start with ws:// or wss://');
    }
    
    // Check authentication - either user/pass pair or token
    if (!config.token) {
      if (!config.user || !config.pass) {
        errors.push('Either token or username/password must be provided');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create instance
export const natsConfigService = new NatsConfigService();
