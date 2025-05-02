// src/services/index.js
import { apiHelpers } from './api';

// Entity services
import { edgeService, validateEdgeCode, generateEdgeCode } from './edge/edgeService';
import { locationService, parseLocationPath, validateLocationCode, generateLocationCode, computeLocationPath, locationTypes as locationTypeOptions } from './location/locationService';
import { thingService, validateThingCode, generateThingCode, getThingTypeAbbreviation } from './thing/thingService';
import { clientService, generateClientUsername, generateSecurePassword } from './client/clientService';
import { topicPermissionService, validateTopic } from './topic-permission/topicPermissionService';
import { userService } from './user/userService';
import { auditLogService } from './audit/auditLogService';

// Type management services
import { edgeTypeService } from './type/edgeTypeService';
import { edgeRegionService } from './type/edgeRegionService';
import { locationTypeService } from './type/locationTypeService';
import { thingTypeService } from './type/thingTypeService';

// NATS services
import natsService from './nats/natsService';
import { natsConfigService } from './nats/natsConfigService';

// Legacy type exports (empty arrays for backward compatibility)
export const edgeTypes = [];
export const edgeRegions = [];
export const locationTypes = [];
export const thingTypes = [];

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
  userService,
  auditLogService,

  // Edge utilities
  validateEdgeCode,
  generateEdgeCode,
  
  // Location utilities
  parseLocationPath,
  validateLocationCode,
  generateLocationCode,
  computeLocationPath,
  locationTypeOptions,  // Export the imported locationTypes with a different name
  
  // Thing utilities
  validateThingCode,
  generateThingCode,
  getThingTypeAbbreviation,
  
  // Client utilities
  generateClientUsername,
  generateSecurePassword,
  
  // Topic permission utilities
  validateTopic,
  
  // Type management services
  edgeTypeService,
  edgeRegionService,
  locationTypeService,
  thingTypeService,
  
  // NATS services
  natsService,
  natsConfigService
};
