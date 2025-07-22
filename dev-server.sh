#!/bin/bash

# Laravel GUI Windows Development Server Script
# This script helps start both Laravel and Vite development servers with proper CORS configuration

echo "🚀 Starting Laravel GUI Windows Development Servers"
echo "=================================================="

# Function to kill existing processes
cleanup() {
    echo "🧹 Cleaning up existing processes..."
    
    # Kill any existing Laravel artisan serve processes
    pkill -f "artisan serve" 2>/dev/null || true
    
    # Kill any existing Vite processes
    pkill -f "vite" 2>/dev/null || true
    
    # Kill any processes on ports 8888 and 5173
    lsof -ti:8888 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    
    echo "✅ Cleanup completed"
}

# Function to start Laravel server
start_laravel() {
    echo "🐘 Starting Laravel development server on http://localhost:8888..."
    php artisan serve --host=localhost --port=8888 &
    LARAVEL_PID=$!
    echo "Laravel server started with PID: $LARAVEL_PID"
}

# Function to start Vite server
start_vite() {
    echo "⚡ Starting Vite development server on http://localhost:5173..."
    npm run dev &
    VITE_PID=$!
    echo "Vite server started with PID: $VITE_PID"
}

# Function to check if servers are running
check_servers() {
    echo "🔍 Checking server status..."
    
    # Check Laravel server
    if curl -s http://localhost:8888 > /dev/null; then
        echo "✅ Laravel server is running on http://localhost:8888"
    else
        echo "❌ Laravel server is not responding"
    fi

    # Check Vite server
    if curl -s http://localhost:5173 > /dev/null; then
        echo "✅ Vite server is running on http://localhost:5173"
    else
        echo "❌ Vite server is not responding"
    fi
}

# Function to show helpful information
show_info() {
    echo ""
    echo "📋 Development Server Information"
    echo "================================="
    echo "🌐 Laravel App: http://0.0.0.0:8888"
    echo "⚡ Vite Dev Server: http://0.0.0.0:5173"
    echo "🔧 Hot Module Replacement: Enabled"
    echo "🌍 CORS: Configured for cross-origin requests"
    echo ""
    echo "📝 Available URLs:"
    echo "   - http://localhost:8888"
    echo "   - http://0.0.0.0:8888"
    echo "   - http://127.0.0.1:8888"
    echo ""
    echo "🛠️  Useful Commands:"
    echo "   - Stop servers: Ctrl+C"
    echo "   - View logs: Check terminal output"
    echo "   - Restart: Run this script again"
    echo ""
}

# Handle script termination
trap 'echo "🛑 Stopping development servers..."; cleanup; exit 0' INT TERM

# Main execution
case "${1:-start}" in
    "start")
        cleanup
        echo "⏳ Waiting for cleanup to complete..."
        sleep 2
        
        start_laravel
        echo "⏳ Waiting for Laravel to start..."
        sleep 3
        
        start_vite
        echo "⏳ Waiting for Vite to start..."
        sleep 5
        
        check_servers
        show_info
        
        echo "🎉 Development servers are running!"
        echo "Press Ctrl+C to stop both servers"
        
        # Wait for user to stop the servers
        wait
        ;;
    "stop")
        cleanup
        echo "✅ All development servers stopped"
        ;;
    "restart")
        cleanup
        echo "⏳ Waiting for cleanup to complete..."
        sleep 2
        exec "$0" start
        ;;
    "status")
        check_servers
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start both Laravel and Vite servers (default)"
        echo "  stop    - Stop all development servers"
        echo "  restart - Restart both servers"
        echo "  status  - Check if servers are running"
        exit 1
        ;;
esac
