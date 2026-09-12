#!/bin/sh
echo "Waiting for PostgreSQL database to be ready..."
sleep 5
echo "Database schema will be verified by backend code"
echo "Starting backend server..."
exec node server.js
