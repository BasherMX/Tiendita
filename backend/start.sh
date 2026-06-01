#!/bin/sh
echo "Waiting for SQL Server to be ready..."
sleep 15
echo "Database will be created by the backend code"
echo "Starting backend server..."
exec node server.js
