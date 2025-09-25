#!/bin/bash

# Frontend build script for Render deployment
set -e  # Exit on any error

echo "Starting frontend build process..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist dist-merged

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the web app
echo "Building web application..."
npm run build:web

# Create merged distribution directory
echo "Creating merged distribution..."
mkdir -p dist-merged

# Copy server files if they exist
if [ -d "dist/server" ]; then
    echo "Copying server files..."
    cp -r dist/server/* dist-merged/
fi

# Copy client files if they exist
if [ -d "dist/client" ]; then
    echo "Copying client files..."
    cp -r dist/client/* dist-merged/
fi

echo "Build completed successfully!"
echo "Files in dist-merged:"
ls -la dist-merged/