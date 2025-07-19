# Window Estimate System

A Laravel application with Inertia.js and React for creating window estimates through a wizard-style GUI interface. This application allows users to create estimates with customer information, add windows, and generate downloadable PDF files.

## Features

- Wizard-style GUI with modal-focused steps
- Customer information management
- Window specification and configuration
- PDF estimate generation and download
- Integration with external API for data processing

## Requirements

- PHP 8.1 or higher
- Composer
- Node.js (v16+) and npm
- SQLite or other database system
- External API running on port 8001

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
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

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
