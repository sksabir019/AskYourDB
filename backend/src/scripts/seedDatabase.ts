import mongoose from 'mongoose';
import { config } from '../configs';
import { logger } from '../utils/logger';

// Connect to MongoDB
async function connectDB() {
  const uri = config.database.mongo.uri.replace('localhost', '127.0.0.1');
  await mongoose.connect(uri);
  logger.info('Connected to MongoDB for seeding');
}

// Seed data
async function seedDatabase() {
  try {
    await connectDB();

    // Clear existing data
    await mongoose.connection.db.dropDatabase();
    logger.info('Cleared existing database');

    // Define schemas
    const userSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
    const productSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
    const orderSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
    const customerSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

    const User = mongoose.model('users', userSchema);
    const Product = mongoose.model('products', productSchema);
    const Order = mongoose.model('orders', orderSchema);
    const Customer = mongoose.model('customers', customerSchema);

    // Date helpers
    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Generate large user dataset (100 users)
    const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Karen', 'Liam', 'Maria', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe', 'Adam', 'Beth', 'Chris', 'Diana'];
    const lastNames = ['Johnson', 'Smith', 'White', 'Brown', 'Davis', 'Wilson', 'Lee', 'Taylor', 'Martinez', 'Anderson', 'Thomas', 'Jackson', 'Garcia', 'Rodriguez', 'Miller', 'Moore', 'Martin', 'Clark', 'Lewis', 'Walker'];
    const roles = ['admin', 'user', 'user', 'user', 'user', 'moderator', 'user', 'user'];
    const countries = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Spain', 'Japan', 'Italy', 'Brazil'];
    const plans = ['free', 'basic', 'basic', 'premium', 'premium'];
    
    const users = [];
    for (let i = 0; i < 100; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const daysOld = i < 40 ? Math.floor(Math.random() * 30) + 1 : Math.floor(Math.random() * 150) + 31;
      const status = daysOld > 90 && Math.random() > 0.7 ? 'inactive' : 'active';
      
      users.push({
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        role: roles[i % roles.length],
        status,
        signupDate: daysAgo(daysOld),
        lastLogin: status === 'active' ? daysAgo(Math.floor(Math.random() * 7)) : daysAgo(Math.floor(Math.random() * 60) + 30),
        country: countries[i % countries.length],
        plan: plans[i % plans.length],
      });
    }
    await User.insertMany(users);
    logger.info(`Inserted ${users.length} users`);

    // Generate large product dataset (50 products)
    const productCategories = {
      Electronics: [
        'Laptop Pro 15', 'Laptop Pro 13', 'Gaming Laptop', 'Ultrabook Air', 'Wireless Mouse', 'Wired Mouse', 'Gaming Mouse',
        'USB-C Hub', 'USB Hub', 'HDMI Cable', '4K Monitor 27"', '4K Monitor 32"', 'HD Monitor', 'Keyboard Mechanical',
        'Keyboard Wireless', 'Webcam HD', 'Webcam 4K', 'Headphones Wireless', 'Headphones Wired', 'Earbuds Pro',
      ],
      Furniture: [
        'Office Chair Premium', 'Office Chair Basic', 'Gaming Chair', 'Standing Desk Electric', 'Standing Desk Manual',
        'Computer Desk', 'Desk Lamp LED', 'Desk Lamp Classic', 'Bookshelf 5-Tier', 'Bookshelf 3-Tier',
        'Filing Cabinet', 'Monitor Stand', 'Footrest', 'Cable Organizer',
      ],
      Stationery: [
        'Notebook Set Premium', 'Notebook Set Basic', 'Pen Collection Blue', 'Pen Collection Black', 'Pencil Set',
        'Marker Set', 'Highlighter Pack', 'Sticky Notes', 'Paper Clips', 'Stapler',
        'Scissors', 'Tape Dispenser', 'Eraser Pack', 'Ruler Set',
      ],
    };

    const products = [];
    let productIndex = 0;
    
    for (const [category, productNames] of Object.entries(productCategories)) {
      for (const productName of productNames) {
        let basePrice = 10 + Math.random() * 40;
        if (category === 'Electronics') {
          basePrice = 50 + Math.random() * 1200;
        } else if (category === 'Furniture') {
          basePrice = 30 + Math.random() * 500;
        }
        
        products.push({
          name: productName,
          category,
          price: Math.round(basePrice * 100) / 100,
          stock: Math.floor(Math.random() * 200) + 20,
          sales: Math.floor(Math.random() * 1500) + 50,
          rating: Math.round((4 + Math.random() * 1) * 10) / 10,
          sku: `${category.substring(0, 3).toUpperCase()}-${String(productIndex++).padStart(3, '0')}`,
        });
      }
    }
    
    await Product.insertMany(products);
    logger.info(`Inserted ${products.length} products`);

    // Generate large customer dataset (150 customers)
    const customers = [];
    for (let i = 0; i < 150; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const daysOld = Math.floor(Math.random() * 180) + 1;
      const totalOrders = Math.floor(Math.random() * 15) + 1;
      const avgOrderValue = 50 + Math.random() * 500;
      const status = totalOrders > 0 && daysOld < 120 ? 'active' : 'inactive';
      const lastOrder = status === 'active' ? Math.floor(Math.random() * 30) + 1 : Math.floor(Math.random() * 60) + 31;
      
      customers.push({
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@customer.com`,
        phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
        status,
        totalOrders,
        totalSpent: Math.round(totalOrders * avgOrderValue * 100) / 100,
        joinDate: daysAgo(daysOld),
        lastOrderAt: daysAgo(lastOrder),
      });
    }
    await Customer.insertMany(customers);
    logger.info(`Inserted ${customers.length} customers`);

    // Generate large order dataset (300 orders)
    const orderStatuses = ['pending', 'pending', 'pending', 'shipped', 'shipped', 'completed', 'completed', 'completed', 'completed'];
    const orders = [];
    
    for (let i = 0; i < 300; i++) {
      const customer = customers[i % customers.length];
      const status = orderStatuses[i % orderStatuses.length];
      
      // Determine order date based on status
      let orderAge;
      if (status === 'pending') {
        orderAge = Math.floor(Math.random() * 7) + 1; // Last 7 days
      } else if (status === 'shipped') {
        orderAge = Math.floor(Math.random() * 10) + 5; // 5-15 days ago
      } else {
        orderAge = Math.floor(Math.random() * 60) + 15; // 15-75 days ago
      }
      
      // Select 1-4 random products
      const numProducts = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let total = 0;
      
      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = product.price * quantity;
        total += itemTotal;
        
        orderItems.push({
          product: product.name,
          quantity,
          price: product.price,
        });
      }
      
      const orderDate = daysAgo(orderAge);
      const shippedAt = status !== 'pending' ? daysAgo(orderAge - Math.floor(Math.random() * 3) - 1) : null;
      const deliveredAt = status === 'completed' ? daysAgo(orderAge - Math.floor(Math.random() * 5) - 3) : null;
      
      orders.push({
        orderNumber: `ORD-${String(i + 1).padStart(5, '0')}`,
        customerEmail: customer.email,
        customerName: customer.name,
        items: orderItems,
        total: Math.round(total * 100) / 100,
        status,
        orderDate,
        shippedAt,
        deliveredAt,
      });
    }
    
    await Order.insertMany(orders);
    logger.info(`Inserted ${orders.length} orders`);

    logger.info('✅ Database seeded successfully!');

    logger.info('✅ Database seeded successfully!');
    logger.info(`
Summary:
- Users: ${users.length}
- Products: ${products.length}
- Orders: ${orders.length}
- Customers: ${customers.length}
    `);

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the seed
void (async () => {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
})();
