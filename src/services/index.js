// src/services/index.js - Central export point for all services
import { apiHelpers } from './api'

// Entity services
import { edgeService, edgeRegions, edgeTypes, validateEdgeCode, generateEdgeCode } from './edge/edgeService'
import { locationService, locationTypes, parseLocationPath, validateLocationCode, generateLocationCode, locationLevels, locationZones } from './location/locationService'
import { thingService, thingTypes, validateThingCode, generateThingCode, getThingTypeAbbreviation } from './thing/thingService'
import { clientService, generateClientUsername, generateSecurePassword } from './client/clientService'
import { topicPermissionService, validateTopic } from './topic-permission/topicPermissionService'

// Export all services and utilities
export {
  // API helpers
  apiHelpers,
  
  // Entity services
  edgeService,
  locationService,
  thingService,
  clientService,
  topicPermissionService,
  
  // Edge utilities
  edgeRegions,
  edgeTypes,
  validateEdgeCode,
  generateEdgeCode,
  
  // Location utilities
  locationTypes,
  parseLocationPath,
  validateLocationCode,
  generateLocationCode,
  locationLevels,
  locationZones,
  
  // Thing utilities
  thingTypes,
  validateThingCode,
  generateThingCode,
  getThingTypeAbbreviation,
  
  // Client utilities
  generateClientUsername,
  generateSecurePassword,
  
  // Topic permission utilities
  validateTopic
}
