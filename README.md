# Laravel GUI Windows

A comprehensive Laravel application with Inertia.js and React for window estimation with offline-first functionality and CouchDB synchronisation.

## 🚀 Features

### **Core Functionality**
- **Offline-First Architecture**: Create and manage estimates without internet connection
- **PouchDB/CouchDB Sync**: Bidirectional data synchronisation with conflict resolution
- **Progressive Web App (PWA)**: Installable app with service worker caching
- **Touch-Optimised Interface**: Designed for Surface Pro and tablet devices
- **Real-Time Pricing**: Dynamic pricing engine with VAT calculations

### **Estimate Management**
- **Wizard-Style Creation**: Step-by-step estimate building process
- **Window Configuration**: Detailed window types, extras, and finishes
- **Photo Capture**: Take photos of windows for estimates
- **Tree View Management**: Hierarchical window organisation
- **PDF Generation**: Professional estimate documents

### **Data & Sync**
- **Force Sync**: Overwrite local data with CouchDB data
- **Real-Time Status**: Monitor sync progress and connection status
- **Configuration Management**: Window types, extras, finishes stored in CouchDB
- **Offline Resilience**: Works completely offline with last synced data

### **Advanced Features**
- **Role-Based Permissions**: User access control
- **Monday.com Integration**: CRM synchronisation
- **Address Lookup**: Postcode-based address completion
- **Multiple Options**: Create estimates with different window combinations

## 📋 Requirements

- **PHP**: 8.1 or higher
- **Node.js**: 18 or higher
- **Composer**: Latest version
- **CouchDB**: 3.3 or higher (for data sync)
- **Laravel**: 11.x

## 🛠 Installation

### **1. Clone Repository**
```bash
git clone https://github.com/wemakesit/laravel-gui-windows.git
cd laravel-gui-windows
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Install JavaScript dependencies

```bash
npm install
```

### 4. Set up environment variables

```bash
cp .env.example .env
php artisan key:generate
```

Edit the `.env` file to configure your database and API connection:

```env
DB_CONNECTION=sqlite
# Or configure MySQL/PostgreSQL if preferred

# API Configuration
API_BASE_URL=http://localhost:8001

# Postcodes.io API for Address Lookup (free service)
POSTCODES_API_URL=https://api.postcodes.io
```

The application uses the free Postcodes.io API for address lookup, so no API key is required.

### 5. Set up the database

```bash
php artisan migrate
```

### 6. Create storage link for files

```bash
php artisan storage:link
```

## Running the Application

### Development Mode

1. Start the Laravel server:

   ```bash
   php artisan serve
   ```

2. In a separate terminal, start the Vite development server:

   ```bash
   npm run dev
   ```

3. Access the application at [http://localhost:8000](http://localhost:8000)

### Production Mode

1. Build the frontend assets:

   ```bash
   npm run build
   ```

2. Start the Laravel server:

   ```bash
   php artisan serve
   ```

3. Access the application at [http://localhost:8000](http://localhost:8000)

## Using the Window Estimate System

1. Navigate to the main dashboard at `/` in your browser
2. Click "Create New Window Estimate" to start the wizard
3. Follow the wizard steps:
   - Enter customer information
   - Add and configure windows
   - Review the estimate
4. Click "Generate Estimate" to create a downloadable PDF

## File Storage

Generated files and estimates are stored in the `storage/app/` directory. Make sure this directory is writable by the web server.

## API Integration

The application integrates with an external API running on port 8001. Ensure the API is running and properly configured in your `.env` file.

## Address Lookup Integration

The application uses the free Postcodes.io API for real UK address lookup by postcode. This service:

- Requires no API key or registration
- Provides postcode lookup for the entire UK
- Returns geographic data for postcodes
- Includes nearby postcodes to provide multiple address options

The implementation creates address suggestions based on the postcode data, allowing users to select from these options or enter their address manually if needed.

Since Postcodes.io is a free service, there are no usage limits to worry about, making it ideal for development and production use.

## 🗄️ CouchDB Setup (Optional)

For full offline sync functionality, set up CouchDB:

### **Using Docker**
```bash
# Run CouchDB container
docker run -d --name couchdb-local \
  -p 5984:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=password \
  -v couchdb-data:/opt/couchdb/data \
  couchdb:3.3

# Create databases
curl -X PUT http://admin:password@localhost:5984/window_config
curl -X PUT http://admin:password@localhost:5984/window_estimates
```

### **Environment Configuration**
Add to your `.env` file:
```env
COUCHDB_CONFIG_URL=http://admin:password@localhost:5984/window_config
COUCHDB_ESTIMATES_URL=http://admin:password@localhost:5984/window_estimates
```

## 📱 Offline Functionality

### **Key Features**
- **Works Offline**: Create estimates without internet connection
- **PouchDB Storage**: Local database with CouchDB sync
- **Auto-Sync**: Data syncs automatically when online
- **Force Sync**: Manual sync from Settings → Data Sync tab
- **Status Monitoring**: Real-time sync status display

### **Data Management**
- **Settings Page**: Configure window types, extras, finishes
- **Force Sync**: Overwrite local data with CouchDB data
- **View Cached Data**: See what's stored locally
- **Sync Status**: Monitor connection and sync progress

## 🏗 Architecture

### **Frontend Stack**
- **Laravel 11**: PHP framework
- **Inertia.js**: SPA without API
- **React 18**: UI library with TypeScript
- **Tailwind CSS**: Utility-first styling
- **Headless UI**: Accessible components

### **Offline & Sync**
- **PouchDB**: Local database storage
- **CouchDB**: Remote database sync
- **Service Worker**: Caching strategy
- **PWA**: Progressive Web App features

### **Key Services**
- **PouchDBService**: Database operations and sync
- **ConfigCacheService**: Configuration management
- **OfflineEstimateService**: Offline estimate creation
- **LocalPricingEngine**: Client-side pricing calculations
- **PWAService**: Progressive Web App functionality

## License

This project is proprietary software developed by WeMakesIt.
The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
