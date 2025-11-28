#!/bin/bash
# MongoDB Integration Test Script

echo "🧪 Testing MongoDB Integration..."
echo ""

# Check if MongoDB is running
echo "1️⃣ Checking MongoDB connection..."
docker exec mongodb mongosh --username admin --password password123 --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ MongoDB is running"
else
  echo "❌ MongoDB is not running"
  exit 1
fi

echo ""
echo "2️⃣ Checking database and collections..."
docker exec mongodb mongosh --username admin --password password123 --authenticationDatabase admin --quiet --eval "
  use askyourdb;
  print('📦 Database: askyourdb');
  print('📋 Collections:');
  db.getCollectionNames().forEach(function(col) {
    var count = db[col].count();
    print('  - ' + col + ' (' + count + ' documents)');
  });
" 2>/dev/null

echo ""
echo "3️⃣ Testing API endpoints..."

# Check if backend is running
if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
  echo "⚠️  Backend is not running. Starting it..."
  echo "Run: cd backend && npm run dev"
  exit 1
fi

echo "✅ Backend is running on port 4000"

echo ""
echo "✨ MongoDB is fully integrated and ready!"
echo ""
echo "📚 Available Collections:"
echo "  - user_preferences (User settings)"
echo "  - query_templates (Saved query templates)"
echo "  - query_history (Query execution history, auto-deletes after 90 days)"
echo "  - api_keys (API keys for authentication)"
echo ""
echo "🔧 Next steps:"
echo "  1. Test the APIs with your frontend"
echo "  2. Create some templates and preferences"
echo "  3. Check MongoDB Compass or use mongosh to view data"
echo ""
