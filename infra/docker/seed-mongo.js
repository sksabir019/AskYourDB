#!/usr/bin/env node

/**
 * Simple MongoDB seed script for Docker production environment
 * Run with: docker exec -i askyourdb-mongo-prod mongosh -u admin -p password123 --authenticationDatabase admin askyourdb < seed-mongo.js
 */

// Drop existing collections
db.users.drop();
db.queryhistories.drop();
db.userpreferences.drop();
db.querytemplates.drop();

// Create sample user
db.users.insertOne({
  _id: ObjectId(),
  email: "demo@example.com",
  passwordHash: "$2b$10$YourHashHere", // You'll need to generate this properly
  createdAt: new Date(),
  updatedAt: new Date(),
  __v: 0
});

// Create sample query templates
db.querytemplates.insertMany([
  {
    _id: ObjectId(),
    name: "List All Customers",
    description: "Retrieve all customers from the database",
    sqlQuery: "SELECT * FROM customers LIMIT 10",
    dbType: "postgres",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  },
  {
    _id: ObjectId(),
    name: "Recent Orders",
    description: "Get orders from the last 30 days",
    sqlQuery: "SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '30 days' ORDER BY created_at DESC",
    dbType: "postgres",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  },
  {
    _id: ObjectId(),
    name: "Top Products",
    description: "Find best-selling products",
    sqlQuery: "SELECT product_id, product_name, SUM(quantity) as total_sold FROM orders JOIN products ON orders.product_id = products.id GROUP BY product_id ORDER BY total_sold DESC LIMIT 10",
    dbType: "postgres",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  }
]);

print("✅ MongoDB seeded successfully");
print("Collections created:");
print("- users: " + db.users.countDocuments());
print("- querytemplates: " + db.querytemplates.countDocuments());
