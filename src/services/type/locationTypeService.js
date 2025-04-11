// src/services/type/locationTypeService.js
import { TypeService } from './typeService'

/**
 * Service for location type operations
 * 
 * Location Type Schema Documentation
 * This service interacts with the 'location_types' collection in PocketBase.
 * The schema consists of:
 * - id: Unique identifier (auto-generated)
 * - type: Display name of the location type (e.g., "Meeting Room")
 * - code: Value used for location identification (e.g., 'meeting-room')
 * - description: Optional detailed description
 * - created: Creation timestamp (auto-generated)
 * - updated: Update timestamp (auto-generated)
 */
export class LocationTypeService extends TypeService {
  constructor() {
    super('location_types', {
      // Any specific options for location types
    })
  }
  
  /**
   * Get all active location types for dropdown options
   * @returns {Promise<Array>} - Array of {label, value} objects for dropdowns
   */
  async getTypeOptions() {
    try {
      const response = await this.getTypes({
        sort: 'type'
      });
      
      // Map to options format
      return response.data.items.map(item => ({
        label: item.type,
        value: item.code
      }));
    } catch (error) {
      console.error('Error fetching location type options:', error);
      return [];
    }
  }
  
  /**
   * Validate code format for location types
   * @param {string} code - Code to validate
   * @returns {boolean} - True if valid
   */
  validateCode(code) {
    // Location type codes should be kebab-case
    const pattern = /^[a-z][-a-z0-9]*$/;
    return pattern.test(code);
  }
}

// Create instance
export const locationTypeService = new LocationTypeService();
