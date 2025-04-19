// src/utils/uuidUtils.js
import { uuidv7 } from 'uuidv7';

/**
 * Generate a UUIDv7 string
 * UUIDv7 format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
 * where:
 * - First 48 bits (12 hex chars): Unix timestamp in milliseconds
 * - 'x' represents random or clock data
 * - '7' is the UUID version
 * - 'y' is 8, 9, A, or B (the variant, first 2 bits are '10')
 * 
 * @returns {string} - UUIDv7 string in standard 36-character format
 */
export function generateUUIDv7() {
  return uuidv7();
}

/**
 * Check if a string is a valid UUID (of any version)
 * @param {string} uuid - String to validate
 * @returns {boolean} - True if valid UUID format
 */
export function isValidUUID(uuid) {
  if (!uuid) return false;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
}

/**
 * Check if a string is a valid UUIDv7
 * @param {string} uuid - String to validate
 * @returns {boolean} - True if valid UUIDv7 format
 */
export function isValidUUIDv7(uuid) {
  // First check basic UUID format
  if (!isValidUUID(uuid)) {
    return false;
  }
  
  // Check version (digit after 3rd hyphen should be 7)
  return uuid.charAt(14) === '7';
}
