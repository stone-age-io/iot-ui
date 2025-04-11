// src/services/type/edgeTypeService.js
import { TypeService } from './typeService'

/**
 * Service for edge type operations
 * 
 * Edge Type Schema Documentation
 * This service interacts with the 'edge_types' collection in PocketBase.
 * The schema consists of:
 * - id: Unique identifier (auto-generated)
 * - type: Display name of the edge type
 * - code: Unique code used in edge codes (e.g., 'bld' for Building)
 * - description: Optional detailed description
 * - created: Creation timestamp (auto-generated)
 * - updated: Update timestamp (auto-generated)
 */
export class EdgeTypeService extends TypeService {
  constructor() {
    super('edge_types', {
      // Any specific options for edge types
    })
  }
  
  /**
   * Get all active edge types for dropdown options
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
      console.error('Error fetching edge type options:', error);
      return [];
    }
  }
  
  /**
   * Validate code format for edge types
   * @param {string} code - Code to validate
   * @returns {boolean} - True if valid
   */
  validateCode(code) {
    // Edge type codes should be 2-4 lowercase letters
    const pattern = /^[a-z]{2,4}$/;
    return pattern.test(code);
  }
}

// Create instance
export const edgeTypeService = new EdgeTypeService();
