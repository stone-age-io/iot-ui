# IoT Platform Management UI

This is the frontend web application for managing an IoT platform focused on physical access control and building automation. The UI provides intuitive interfaces for managing edge installations, locations, devices, messaging system access, and type definitions.

## Overview

The web interface enables administrators to:

- Register and manage edge installations (buildings, campuses, etc.)
- Organize physical locations in a hierarchical structure
- Control IoT devices with detailed configuration options
- Manage messaging clients and topic permissions
- Define and manage entity types (edge types, edge regions, location types, thing types)
- Connect to and monitor NATS messaging systems
- Monitor system activity via dashboards and visualizations

## Technology Stack

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: PrimeVue for rich UI elements
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: Pinia for reactive state management and composables for local state
- **Routing**: Vue Router for SPA navigation
- **HTTP Client**: Axios for API communication
- **Form Validation**: Vuelidate for form validation
- **Messaging**: NATS WebSocket client for real-time messaging
- **Date Handling**: Day.js for date formatting and manipulation

## Project Structure

```
src/
├── assets/              # Static assets and global CSS
├── components/          # Reusable Vue components
│   ├── common/          # Common UI components
│   ├── dashboard/       # Dashboard-specific components
│   └── map/             # Map and geospatial components
├── composables/         # Vue 3 composable functions
├── layouts/             # Page layout components
├── router/              # Vue Router configuration
├── services/            # API services and utilities
│   ├── base/            # Base service classes
│   ├── edge/            # Edge-related services
│   ├── location/        # Location-related services
│   ├── thing/           # Thing-related services
│   ├── client/          # Client-related services
│   ├── topic-permission/# Topic permission services
│   ├── type/            # Type management services
│   ├── nats/            # NATS messaging services
│   ├── user/            # User profile services
│   └── index.js         # Central export point
├── stores/              # Pinia state stores
└── views/               # Page components
    ├── Auth/            # Authentication views
    ├── Entities/        # Entity management views
    │   ├── Edges/       # Edge management
    │   ├── Locations/   # Location management
    │   └── Things/      # IoT device management
    ├── Messaging/       # Messaging system views
    │   ├── Clients/     # Client management
    │   └── TopicPermissions/ # Permission management
    ├── Profile/         # User profile views
    ├── Settings/        # User settings views
    └── Types/           # Type definition views
        ├── EdgeTypes/   # Edge type management
        ├── EdgeRegions/ # Edge region management
        ├── LocationTypes/ # Location type management
        └── ThingTypes/  # Thing type management
```

## Architecture

The application follows several key architectural principles:

1. **Component-Based Design**: The UI is built using reusable Vue components with clear responsibilities.
2. **Composition API**: Vue 3 Composition API with `<script setup>` syntax for all components.
3. **Composable Functions**: Reusable logic extracted into composable functions for better code organization and reuse.
4. **Service Layer**: API interactions are encapsulated in service modules that extend a base service class.
5. **State Management**: Application state is managed using Pinia stores and local state in composables.
6. **Type System**: Comprehensive type management for entity definitions, with a consistent UI pattern.

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Access to the backend API (PocketBase server)
- Optional: NATS server for messaging features

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/iot-management-ui.git
   cd iot-management-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   # Create .env from example
   cp .env.example .env
   # Edit values in .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser at http://localhost:5173 (or the port shown in your terminal)

## Configuration

The UI can be configured via environment variables:

- `VITE_API_URL`: Base URL for API endpoints
- `VITE_MQTT_HOST`: MQTT broker URL for connection credentials display
- `VITE_GRAFANA_URL`: Grafana dashboard URL for monitoring integration
- `VITE_NATS_HOST`: NATS WebSocket server URL for real-time messaging

## Building for Production

To build the application for production:

```bash
npm run build
```

The build output will be in the `dist` directory, ready for deployment to any static hosting service.

## Deployment

The application can be deployed to any static web hosting service:

1. Build the project: `npm run build`
2. Deploy the contents of the `dist` directory to your hosting service
3. Configure your server to route all requests to `index.html` for proper SPA routing

## Development Patterns

### Components

- Use the Composition API with `<script setup>` syntax
- Organize complex components into smaller, focused components
- Use props for parent-to-child communication
- Use events for child-to-parent communication

### Composables

- Use composables to encapsulate reusable logic
- Entity composables handle entity-specific operations and UI formatting
- Form composables manage form state, validation, and submission
- Utility composables provide shared functionality

### Services

- Use BaseService class for common CRUD operations
- Entity services extend BaseService with entity-specific operations
- Type services manage entity type definitions
- Utility services provide additional functionality

### Views

- List Views display data tables with search, pagination, and row actions
- Detail Views show entity details with related information and actions
- Create/Edit Views use form composables for consistent form handling
- All views use consistent UI patterns and components

### Styling

- Use Tailwind utility classes for component styling
- Use PrimeVue components for complex UI elements
- Follow the established design patterns for consistency

## Type Management System

The application includes a comprehensive type management system:

- **Edge Types**: Define different types of edge nodes (e.g., Building, Data Center)
- **Edge Regions**: Define geographic regions for edges (e.g., North America, Europe)
- **Location Types**: Define types of locations (e.g., Meeting Room, Work Area)
- **Thing Types**: Define types of IoT devices (e.g., Temperature Sensor, Camera)

Each type system provides:
- Create/Edit/List/Detail views with consistent UI
- Type-specific styling for visual representation in the UI
- Code generation and validation for standardized identifiers
- Usage tracking showing which entities use each type

## Browser Compatibility

The application is designed to work with modern browsers:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Known Limitations

- The application requires JavaScript to be enabled
- Some features may not work optimally on mobile devices
- The application requires a stable connection to the backend API
- Real-time messaging features require WebSocket support

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

Please ensure your code follows the existing architecture patterns and includes appropriate tests.

### Contribution Guidelines

- Follow the established architecture patterns (composables, services, views)
- Use TypeScript for new features when possible
- Ensure proper error handling and loading states
- Write comprehensive documentation for new features
- Follow the existing naming conventions
