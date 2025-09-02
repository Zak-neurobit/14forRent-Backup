#!/bin/bash

# Performance Optimization Rollback Script
# Run this script to revert all performance optimization changes

echo "🔄 Rolling back performance optimizations..."

# Restore all backed up files
cp src/App.perf-backup.tsx src/App.tsx
cp src/services/analyticsService.backup.ts src/services/analyticsService.ts
cp src/hooks/useAdminStats.backup.ts src/hooks/useAdminStats.ts
cp src/services/propertyService.backup.ts src/services/propertyService.ts
cp src/hooks/useProperties.backup.ts src/hooks/useProperties.ts
cp vite.config.backup.ts vite.config.ts
cp package.backup.json package.json

echo "✅ All files restored to their original state"
echo "📦 Run 'npm install' if package.json was changed"
echo "🚀 Run 'npm run dev' to restart the development server"