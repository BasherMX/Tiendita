#!/bin/sh
echo "Waiting for SQL Server..."
sleep 15

echo "Creating database tiendita..."
# We'll skip this for now since we can't easily call sqlcmd from Node alpine
echo "Backend will create the database on first connect"

echo "Starting Node.js server..."
node server.js
