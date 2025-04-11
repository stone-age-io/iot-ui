// src/services/index.js
import { apiHelpers } from './api';

// Entity services
import { edgeService, edgeRegions, edgeTypes, validateEdgeCode, generateEdgeCode } from './edge/edgeService';
import { locationService, locationTypes, parseLocationPath, validateLocationCode, generateLocationCode, locationLevels, locationZones } from './location/locationService';
import { thingService, thingTypes, validateThingCode, generateThingCode, getThingTypeAbbreviation } from './thing/thingService';
import { clientService, generateClientUsername, generateSecurePassword } from './client/clientService';
import { topicPermissionService, validateTopic } from './topic-permission/topicPermissionService';
import { userService } from './user/userService';

// Type management services
import { edgeTypeService } from './type/edgeTypeService';
import { edgeRegionService } from './type/edgeRegionService';
import { locationTypeService } from './type/locationTypeService';
import { thingTypeService } from './type/thingTypeService';

// NATS services
import natsService from './nats/natsService';
import { natsConfigService } from './nats/natsConfigService';

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
