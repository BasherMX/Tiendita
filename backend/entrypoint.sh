#!/bin/sh
echo "Waiting for PostgreSQL database..."
sleep 5

echo "Starting Node.js server..."
node server.js
