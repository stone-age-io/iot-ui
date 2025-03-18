# IoT Platform Management UI

This is the frontend web application for managing an IoT platform focused on physical access control and building automation. The UI provides intuitive interfaces for managing edge installations, locations, devices, and messaging system access.

## Overview

The web interface enables administrators to:

- Register and manage edge installations (buildings, campuses, etc.)
- Organize physical locations in a hierarchical structure
- Control IoT devices with detailed configuration options
- Manage messaging clients and topic permissions
- Monitor system activity via dashboards

## Technology Stack

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: PrimeVue for rich UI elements
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: Pinia for reactive state management
- **Routing**: Vue Router for SPA navigation
- **HTTP Client**: Axios for API communication
- **Form Validation**: Vuelidate for form validation

## Project Structure

```
src/
├── assets/              # Static assets and global CSS
├── components/          # Reusable Vue components
│   ├── common/          # Common UI components
│   └── dashboard/       # Dashboard-specific components
├── layouts/             # Page layout components
├── router/              # Vue Router configuration
├── services/            # API services and utilities
├── stores/              # Pinia state stores
└── views/               # Page components
    ├── Auth/            # Authentication views
    ├── Entities/        # Entity management views
    │   ├── Edges/       # Edge management
    │   ├── Locations/   # Location management
    │   └── Things/      # IoT device management
    └── Messaging/       # Messaging system views
        ├── Clients/     # Client management
        └── TopicPermissions/ # Permission management
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Access to the backend API (PocketBase server)

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

### Services

- Use service modules to encapsulate API calls
- Keep business logic separate from UI components
- Use consistent error handling patterns

### Styling

- Use Tailwind utility classes for component styling
- Use PrimeVue components for complex UI elements
- Follow the established design patterns for consistency

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

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

Please ensure your code follows the existing style patterns and includes appropriate tests.
