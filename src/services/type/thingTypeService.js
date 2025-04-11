// src/services/type/thingTypeService.js
import { TypeService } from './typeService'

/**
 * Service for thing type operations
 * 
 * Thing Type Schema Documentation
 * This service interacts with the 'thing_types' collection in PocketBase.
 * The schema consists of:
 * - id: Unique identifier (auto-generated)
 * - type: Display name of the thing type (e.g., "Temperature Sensor")
 * - code: Unique code used in thing identification (e.g., 'temperature-sensor')
 * - description: Optional detailed description
 * - created: Creation timestamp (auto-generated)
 * - updated: Update timestamp (auto-generated)
 */
export class ThingTypeService extends TypeService {
  constructor() {
    super('thing_types', {
      // Any specific options for thing types
    })
  }
  
  /**
   * Get all active thing types for dropdown options
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
      console.error('Error fetching thing type options:', error);
      return [];
    }
  }
  
  /**
   * Get abbreviated code for a thing type to use in thing codes
   * @param {string} typeCode - Thing type code
   * @returns {string} - Abbreviated code (e.g., 'temp' for 'temperature-sensor')
   */
  getTypeAbbreviation(typeCode) {
    // Map of type codes to abbreviations
    const abbreviations = {
      'reader': 'rdr',
      'controller': 'ctrl',
      'lock': 'lock',
      'temperature-sensor': 'temp',
      'humidity-sensor': 'hum',
      'hvac': 'hvac',
      'lighting': 'light',
      'camera': 'cam',
      'motion-sensor': 'motion',
      'occupancy-sensor': 'occ'
      // Add others as needed
    };
    
    return abbreviations[typeCode] || typeCode.substring(0, 4);
  }
  
  /**
   * Validate code format for thing types
   * @param {string} code - Code to validate
   * @returns {boolean} - True if valid
   */
  validateCode(code) {
    // Thing type codes should be kebab-case
    const pattern = /^[a-z][-a-z0-9]*$/;
    return pattern.test(code);
  }
}

// Create instance
export const thingTypeService = new ThingTypeService();
