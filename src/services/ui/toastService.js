// src/services/ui/toastService.js
import { useToast } from 'primevue/usetoast';

/**
 * Centralized toast service to handle application notifications
 * Prevents duplicate toasts by using a singleton pattern
 */
class ToastService {
  constructor() {
    this.toast = null;
    this.initialized = false;
    
    // Track recent toast messages to prevent duplicates
    this.recentToasts = [];
    this.MAX_HISTORY = 10;
  }

  /**
   * Initialize the toast service
   * Must be called once after the app is mounted
   */
  initialize() {
    if (this.initialized) return;
    
    // Call this in the App.vue's onMounted
    this.toast = useToast();
    this.initialized = true;
  }

  /**
   * Show a toast notification
   * @param {Object} options - Toast options
   * @param {string} options.severity - 'success', 'info', 'warn', 'error'
   * @param {string} options.summary - Toast title
   * @param {string} options.detail - Toast message
   * @param {number} options.life - Duration in ms
   * @returns {boolean} - Whether the toast was shown (false if duplicate)
   */
  show(options) {
    if (!this.initialized) {
      console.warn('Toast service not initialized');
      return false;
    }
    
    // Generate a key for this toast
    const toastKey = `${options.severity}:${options.summary}:${options.detail}`;
    
    // Check if this is a duplicate of a recent toast
    if (this.isDuplicate(toastKey)) {
      console.log('Preventing duplicate toast:', options.summary);
      return false;
    }
    
    // Add to recent toasts
    this.addToRecentToasts(toastKey);
    
    // Show the toast
    this.toast.add({
      severity: options.severity || 'info',
      summary: options.summary || '',
      detail: options.detail || '',
      life: options.life || 3000,
      position: 'bottom-right'  // Enforce consistent position
    });
    
    return true;
  }
  
  /**
   * Show a success toast
   * @param {string} summary - Toast title
   * @param {string} detail - Toast message
   * @param {number} life - Duration in ms
   */
  success(summary, detail, life = 3000) {
    this.show({
      severity: 'success',
      summary,
      detail,
      life
    });
  }
  
  /**
   * Show an info toast
   * @param {string} summary - Toast title
   * @param {string} detail - Toast message
   * @param {number} life - Duration in ms
   */
  info(summary, detail, life = 3000) {
    this.show({
      severity: 'info',
      summary,
      detail,
      life
    });
  }
  
  /**
   * Show a warning toast
   * @param {string} summary - Toast title
   * @param {string} detail - Toast message
   * @param {number} life - Duration in ms
   */
  warn(summary, detail, life = 3000) {
    this.show({
      severity: 'warn',
      summary,
      detail,
      life
    });
  }
  
  /**
   * Show an error toast
   * @param {string} summary - Toast title
   * @param {string} detail - Toast message
   * @param {number} life - Duration in ms
   */
  error(summary, detail, life = 5000) {
    this.show({
      severity: 'error',
      summary,
      detail,
      life
    });
  }
  
  /**
   * Check if a toast is a duplicate of a recent one
   * @param {string} toastKey - Unique key for the toast
   * @returns {boolean} - Whether it's a duplicate
   */
  isDuplicate(toastKey) {
    return this.recentToasts.includes(toastKey);
  }
  
  /**
   * Add a toast to the recent history
   * @param {string} toastKey - Unique key for the toast
   */
  addToRecentToasts(toastKey) {
    this.recentToasts.push(toastKey);
    
    // Keep the history limited to MAX_HISTORY items
    if (this.recentToasts.length > this.MAX_HISTORY) {
      this.recentToasts.shift();
    }
    
    // Automatically remove from history after the toast duration
    setTimeout(() => {
      const index = this.recentToasts.indexOf(toastKey);
      if (index !== -1) {
        this.recentToasts.splice(index, 1);
      }
    }, 3000);
  }
}

// Create singleton instance
const toastService = new ToastService();
export default toastService;
