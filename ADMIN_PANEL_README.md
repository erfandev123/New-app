# Admin Panel - Service Management

## Overview
This admin panel allows you to customize the prices and settings of all services in your SocialSphere application. You can edit individual service prices, quantities, and descriptions.

## Features

### 🔐 Authentication
- Secure admin access using admin key
- Default development key: `dev`
- Set `ADMIN_KEY` environment variable for production

### 🔍 Service Management
- **View all services** with current pricing
- **Search services** by name or description
- **Filter by category** to focus on specific service types
- **Edit individual services** with inline forms

### ✏️ Editing Capabilities
- **Price per unit** - Set custom rates for each service
- **Min/Max quantities** - Adjust quantity limits
- **Description** - Update service descriptions
- **Real-time updates** - Changes are saved immediately

### 📱 User Interface
- **Responsive design** - Works on desktop and mobile
- **Modern UI** - Clean, professional interface
- **Easy navigation** - Intuitive controls and layout

## How to Use

### 1. Access Admin Panel
- Navigate to `/admin-services` in your application
- Enter the admin key (default: `dev`)
- Click "Access Admin Panel"

### 2. View Services
- All services are displayed in a grid layout
- Each service shows:
  - Service name and category
  - Current price per unit
  - Min/max quantities
  - Description (if available)

### 3. Edit Services
- Click "Edit Service" on any service card
- Modify the following fields:
  - **Price per Unit**: Set custom pricing (supports 4 decimal places)
  - **Min Quantity**: Minimum order quantity
  - **Max Quantity**: Maximum order quantity
  - **Description**: Service description text
- Click "Save Changes" to update

### 4. Search and Filter
- **Search**: Type in the search box to find specific services
- **Category Filter**: Use dropdown to filter by service category
- **Refresh**: Click refresh button to reload services from API

## API Endpoints

The admin panel uses these backend endpoints:

- `GET /api/admin/services` - Fetch all services
- `PUT /api/admin/services/:id` - Update individual service
- `POST /api/admin/services/bulk-update` - Bulk update services (future feature)

## Security

- Admin key authentication required for all operations
- Environment variable `ADMIN_KEY` should be set in production
- All API calls include admin key in headers

## Development

### Setting Admin Key
```bash
# Development (default)
ADMIN_KEY=dev

# Production
ADMIN_KEY=your-secure-admin-key-here
```

### Testing
1. Start the development server: `npm run dev`
2. Navigate to `/admin-services`
3. Enter admin key: `dev`
4. Test editing services

## Future Enhancements

- Bulk price updates
- Price history tracking
- Service analytics
- Export/import functionality
- User management
- Order management

## Support

For issues or questions about the admin panel, check the console logs and ensure your admin key is properly configured. 