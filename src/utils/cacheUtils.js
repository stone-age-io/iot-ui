/**
 * Cache utilities for API responses
 * Provides functionality to store, retrieve, and manage API response caching
 * Updated to support organization-based caching
 */

// Cache namespace to avoid conflicts with other localStorage items
const CACHE_PREFIX = 'iot_api_cache_';

/**
 * Get the currently logged in user ID and organization ID or null if not authenticated
 * @returns {Object} - User ID and organization ID
 */
function getCurrentUserAndOrgId() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { userId: null, orgId: null };
    
    // For simplicity, if we have a token we'll extract user ID from auth store
    // Use a default 'anonymous' if somehow we don't have a user ID
    // This could be improved by directly decoding the JWT, but we'll keep it simple
    const authData = JSON.parse(localStorage.getItem('auth') || '{"user":null, "currentOrgId":null}');
    return {
      userId: authData.user?.id || 'anonymous',
      orgId: authData.currentOrgId || 'default'
    };
  } catch (error) {
    console.warn('Failed to get current user/org data for cache:', error);
    return { userId: 'anonymous', orgId: 'default' };
  }
}

/**
 * Generate a cache key from the collection name and parameters
 * Now includes user and organization scoping for better isolation
 * 
 * @param {string} collectionName - PocketBase collection name
 * @param {string} operation - Operation type (list, detail, etc)
 * @param {string} id - Optional record ID
 * @param {Object} params - Optional query parameters
 * @param {string} userId - Optional user ID for scoping (defaults to current user)
 * @returns {string} - Cache key
 */
export function generateCacheKey(collectionName, operation, id = null, params = null, userId = null) {
  // Get user ID and org ID for cache segmentation - use provided ID or get current user
  const { userId: currentUserId, orgId: currentOrgId } = getCurrentUserAndOrgId();
  const userScope = userId || currentUserId || 'anonymous';
  
  const parts = [userScope, currentOrgId, collectionName, operation];
  
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
 * Store data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export function setCache(key, data) {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now()
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
 * Get data from cache if it exists
 * @param {string} key - Cache key
 * @returns {Object|null} - Cached data or null if not found
 */
export function getCache(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const cacheItem = JSON.parse(item);
    return cacheItem.data;
  } catch (error) {
    console.warn('Failed to retrieve cache item:', error);
    return null;
  }
}

/**
 * Get cache timestamp if it exists
 * @param {string} key - Cache key
 * @returns {number|null} - Timestamp or null if not found
 */
export function getCacheTimestamp(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const cacheItem = JSON.parse(item);
    return cacheItem.timestamp || null;
  } catch (error) {
    console.warn('Failed to retrieve cache timestamp:', error);
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
 * Now supports user-specific and organization-specific clearing
 * 
 * @param {string} collectionName - PocketBase collection name
 * @param {string} userId - Optional user ID to scope clearing (defaults to current user)
 */
export function clearCollectionCache(collectionName, userId = null) {
  // Get user ID and org ID for cache segmentation - use provided ID or get current user
  const { userId: currentUserId, orgId: currentOrgId } = getCurrentUserAndOrgId();
  const userScope = userId || currentUserId || 'anonymous';
  const prefix = `${CACHE_PREFIX}${userScope}_${currentOrgId}_${collectionName}_`;
  
  // Get all keys in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Clear all cache items for a specific user
 * @param {string} userId - User ID
 */
export function clearUserCache(userId) {
  if (!userId) return;
  
  const prefix = `${CACHE_PREFIX}${userId}_`;
  
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
