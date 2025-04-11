// src/services/type/edgeRegionService.js
import { TypeService } from './typeService'

/**
 * Service for edge region operations
 * 
 * Edge Region Schema Documentation
 * This service interacts with the 'edge_regions' collection in PocketBase.
 * The schema consists of:
 * - id: Unique identifier (auto-generated)
 * - type: Display name of the region (e.g., "North America")
 * - code: Unique code used in edge codes (e.g., 'na' for North America)
 * - description: Optional detailed description
 * - created: Creation timestamp (auto-generated)
 * - updated: Update timestamp (auto-generated)
 */
export class EdgeRegionService extends TypeService {
  constructor() {
    super('edge_regions', {
      // Any specific options for edge regions
    })
  }
  
  /**
   * Get all active edge regions for dropdown options
   * @returns {Promise<Array>} - Array of {label, value} objects for dropdowns
   */
  async getRegionOptions() {
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
      console.error('Error fetching edge region options:', error);
      return [];
    }
  }
  
  /**
   * Validate code format for edge regions
   * @param {string} code - Code to validate
   * @returns {boolean} - True if valid
   */
  validateCode(code) {
    // Edge region codes should be 2-4 lowercase letters
    const pattern = /^[a-z]{2,4}$/;
    return pattern.test(code);
  }
}

// Create instance
export const edgeRegionService = new EdgeRegionService();
