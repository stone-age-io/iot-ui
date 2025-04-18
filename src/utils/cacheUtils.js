/**
 * Cache utilities for API responses
 * Provides functionality to store, retrieve, and manage API response caching
 */

// Cache namespace to avoid conflicts with other localStorage items
const CACHE_PREFIX = 'iot_api_cache_';

// Default TTL (Time To Live) for cache items in minutes
const DEFAULT_TTL = 5;

/**
 * Generate a cache key from the collection name and parameters
 * @param {string} collectionName - PocketBase collection name
 * @param {string} operation - Operation type (list, detail, etc)
 * @param {string} id - Optional record ID
 * @param {Object} params - Optional query parameters
 * @returns {string} - Cache key
 */
export function generateCacheKey(collectionName, operation, id = null, params = null) {
  const parts = [collectionName, operation];
  
  if (id) {
    parts.push(id);
  }
  
  if (params) {
    // Sort keys to ensure consistent cache keys
    const sortedParams = {};
    Object.keys(params).sort().forEach(key => {
      sortedParams[key] = params[key];
    });
    parts.push(JSON.stringify(sortedParams));
  }
  
  return `${CACHE_PREFIX}${parts.join('_')}`;
}

/**
 * Store data in cache with expiration
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlMinutes - Time to live in minutes
 */
export function setCache(key, data, ttlMinutes = DEFAULT_TTL) {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (ttlMinutes * 60 * 1000)
    };
    
    localStorage.setItem(key, JSON.stringify(cacheItem));
    return true;
  } catch (error) {
    console.warn('Failed to set cache item:', error);
    // Handle localStorage quota exceeded
    if (error instanceof DOMException && (
        error.code === 22 || // Chrome quota exceeded
        error.code === 1014 || // Firefox quota exceeded
        error.name === 'QuotaExceededError' || 
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      // Clear oldest cache items to make space
      clearOldestCacheItems();
    }
    return false;
  }
}

/**
 * Get data from cache if it exists and is not expired
 * @param {string} key - Cache key
 * @returns {Object|null} - Cached data or null if not found/expired
 */
export function getCache(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const cacheItem = JSON.parse(item);
    
    // Check if cache has expired
    if (cacheItem.expiry && cacheItem.expiry < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cacheItem.data;
  } catch (error) {
    console.warn('Failed to retrieve cache item:', error);
    return null;
  }
}

/**
 * Remove a specific item from cache
 * @param {string} key - Cache key
 */
export function removeCache(key) {
  localStorage.removeItem(key);
}

/**
 * Clear all cache items for a specific collection
 * @param {string} collectionName - PocketBase collection name
 */
export function clearCollectionCache(collectionName) {
  const prefix = `${CACHE_PREFIX}${collectionName}_`;
  
  // Get all keys in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Clear all API cache items
 */
export function clearAllCache() {
  // Get all keys in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Clear the oldest cache items when storage quota is exceeded
 * Removes approximately 20% of the oldest items
 */
function clearOldestCacheItems() {
  const cacheItems = [];
  
  // Collect all cache items with their timestamps
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        cacheItems.push({
          key,
          timestamp: item.timestamp || 0
        });
      } catch (e) {
        // If item can't be parsed, consider it old
        cacheItems.push({
          key,
          timestamp: 0
        });
      }
    }
  }
  
  // Sort by timestamp (oldest first)
  cacheItems.sort((a, b) => a.timestamp - b.timestamp);
  
  // Remove the oldest 20% of items
  const removeCount = Math.max(1, Math.ceil(cacheItems.length * 0.2));
  cacheItems.slice(0, removeCount).forEach(item => {
    localStorage.removeItem(item.key);
  });
}
