// src/stores/cacheStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Central store for managing cache state, data, and timestamps
 * for the stale-while-revalidate pattern
 */
export const useCacheStore = defineStore('cache', () => {
  // State for tracking when collections were last updated
  const lastUpdated = ref({});
  
  // State for storing collection data (keyed by collection name and operation)
  const cachedData = ref({});
  
  // Collection that's currently being viewed based on route
  const currentCollection = ref(null);
  
  // Background refresh state
  const isRefreshing = ref(false);
  
  // Computed for the current timestamp
  const currentTimestamp = computed(() => {
    if (!currentCollection.value) return null;
    return lastUpdated.value[currentCollection.value] || null;
  });
  
  /**
   * Set the current collection based on route
   * @param {string} collection - Collection name
   */
  function setCurrentCollection(collection) {
    currentCollection.value = collection;
  }
  
  /**
   * Update the timestamp for a collection
   * @param {string} collection - Collection name
   * @param {number} timestamp - Timestamp (default: now)
   */
  function updateTimestamp(collection, timestamp = Date.now()) {
    lastUpdated.value = {
      ...lastUpdated.value,
      [collection]: timestamp
    };
  }
  
  /**
   * Store data for a collection
   * @param {string} collection - Collection name
   * @param {string} operation - Operation type (list, detail)
   * @param {string} id - Optional ID for detail operations
   * @param {Object} data - The data to store
   */
  function storeData(collection, operation, id = null, data) {
    if (!collection || !operation) return;
    
    // Create cacheKey
    const cacheKey = generateDataKey(collection, operation, id);
    
    // Update the cached data
    cachedData.value = {
      ...cachedData.value,
      [cacheKey]: data
    };
  }
  
  /**
   * Get stored data for a collection
   * @param {string} collection - Collection name
   * @param {string} operation - Operation type (list, detail)
   * @param {string} id - Optional ID for detail operations
   * @returns {Object|null} - The stored data or null
   */
  function getData(collection, operation, id = null) {
    if (!collection || !operation) return null;
    
    // Create cacheKey
    const cacheKey = generateDataKey(collection, operation, id);
    
    // Return the cached data if it exists
    return cachedData.value[cacheKey] || null;
  }
  
  /**
   * Generate a key for storing collection data
   * @param {string} collection - Collection name
   * @param {string} operation - Operation type
   * @param {string} id - Optional ID
   * @returns {string} - Data key
   */
  function generateDataKey(collection, operation, id = null) {
    const parts = [collection, operation];
    if (id) parts.push(id);
    return parts.join('_');
  }
  
  /**
   * Clear data for a specific collection
   * @param {string} collection - Collection name to clear
   */
  function clearCollectionData(collection) {
    // Clear timestamps
    if (lastUpdated.value[collection]) {
      const updatedTimestamps = { ...lastUpdated.value };
      delete updatedTimestamps[collection];
      lastUpdated.value = updatedTimestamps;
    }
    
    // Clear collection data
    const updatedData = { ...cachedData.value };
    Object.keys(updatedData).forEach(key => {
      if (key.startsWith(`${collection}_`)) {
        delete updatedData[key];
      }
    });
    cachedData.value = updatedData;
  }
  
  /**
   * Start background refresh
   */
  function startRefresh() {
    isRefreshing.value = true;
  }
  
  /**
   * End background refresh
   */
  function endRefresh() {
    isRefreshing.value = false;
  }
  
  /**
   * Reset all cached data and timestamps
   */
  function resetAll() {
    lastUpdated.value = {};
    cachedData.value = {};
  }
  
  return {
    // State
    lastUpdated,
    cachedData,
    currentCollection,
    isRefreshing,
    currentTimestamp,
    
    // Actions
    setCurrentCollection,
    updateTimestamp,
    storeData,
    getData,
    clearCollectionData,
    startRefresh,
    endRefresh,
    resetAll
  }
})
