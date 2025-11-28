import Knex from 'knex';
import { config } from '../configs';
import { logger } from '../utils/logger';

const knex = Knex({
  client: 'pg',
  connection: {
    host: config.database.postgres.host,
    port: config.database.postgres.port,
    user: config.database.postgres.user,
    password: config.database.postgres.password,
    database: config.database.postgres.database,
  },
});

// Helper function to generate random date within range
function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function seedPostgres() {
  try {
    logger.info('Starting PostgreSQL seed...');

    // Create tables if they don't exist
    await knex.schema.dropTableIfExists('orders');
    await knex.schema.dropTableIfExists('customers');
    await knex.schema.dropTableIfExists('products');
    await knex.schema.dropTableIfExists('users');

    // Create users table
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('role').defaultTo('user');
      table.string('status').defaultTo('active');
      table.timestamp('signup_date').defaultTo(knex.fn.now());
      table.timestamp('last_login');
      table.string('country');
      table.string('plan').defaultTo('free');
    });

    // Create products table
    await knex.schema.createTable('products', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('category').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.integer('stock').defaultTo(0);
      table.integer('sales').defaultTo(0);
      table.decimal('rating', 3, 2).defaultTo(0);
      table.string('sku').unique().notNullable();
    });

    // Create customers table
    await knex.schema.createTable('customers', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('phone');
      table.string('status').defaultTo('active');
      table.integer('total_orders').defaultTo(0);
      table.decimal('total_spent', 12, 2).defaultTo(0);
      table.timestamp('join_date').defaultTo(knex.fn.now());
      table.timestamp('last_order_at');
    });

    // Create orders table
    await knex.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.string('order_number').unique().notNullable();
      table.string('customer_email').notNullable();
      table.string('customer_name').notNullable();
      table.jsonb('items').notNullable();
      table.decimal('total', 12, 2).notNullable();
      table.string('status').defaultTo('pending');
      table.timestamp('order_date').defaultTo(knex.fn.now());
      table.timestamp('shipped_at');
      table.timestamp('delivered_at');
    });

    logger.info('Tables created successfully');

    // Seed Users (100 users)
    const roles = ['user', 'admin', 'moderator', 'editor'];
    const statuses = ['active', 'inactive', 'suspended'];
    const countries = ['USA', 'UK', 'Canada', 'Germany', 'France', 'Australia', 'Japan', 'Brazil', 'India', 'Spain'];
    const plans = ['free', 'basic', 'premium', 'enterprise'];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna', 'James', 'Emma', 'Robert', 'Olivia', 'William', 'Sophia', 'Daniel', 'Ava', 'Matthew', 'Isabella'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Lee', 'Harris', 'Clark', 'Lewis', 'Walker'];

    const users = [];
    for (let i = 0; i < 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      users.push({
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        role: roles[Math.floor(Math.random() * roles.length)],
        status: Math.random() > 0.2 ? 'active' : statuses[Math.floor(Math.random() * statuses.length)],
        signup_date: randomDate(90),
        last_login: randomDate(30),
        country: countries[Math.floor(Math.random() * countries.length)],
        plan: plans[Math.floor(Math.random() * plans.length)],
      });
    }
    await knex('users').insert(users);
    logger.info(`Inserted ${users.length} users`);

    // Seed Products (48 products)
    const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys'];
    const productPrefixes = ['Premium', 'Basic', 'Pro', 'Ultra', 'Classic', 'Modern', 'Vintage', 'Smart'];
    const productTypes = ['Widget', 'Gadget', 'Device', 'Tool', 'Kit', 'Set', 'Pack', 'Bundle'];

    const products = [];
    for (let i = 0; i < 48; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const prefix = productPrefixes[Math.floor(Math.random() * productPrefixes.length)];
      const type = productTypes[Math.floor(Math.random() * productTypes.length)];
      products.push({
        name: `${prefix} ${category} ${type}`,
        category,
        price: Math.round((Math.random() * 500 + 10) * 100) / 100,
        stock: Math.floor(Math.random() * 500),
        sales: Math.floor(Math.random() * 1000),
        rating: Math.round((Math.random() * 2 + 3) * 100) / 100,
        sku: `SKU-${category.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
      });
    }
    await knex('products').insert(products);
    logger.info(`Inserted ${products.length} products`);

    // Seed Customers (150 customers)
    const customerStatuses = ['active', 'inactive', 'vip'];
    const customers = [];
    for (let i = 0; i < 150; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const totalOrders = Math.floor(Math.random() * 50);
      const avgOrderValue = Math.random() * 200 + 50;
      customers.push({
        name: `${firstName} ${lastName}`,
        email: `customer.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        status: Math.random() > 0.3 ? 'active' : customerStatuses[Math.floor(Math.random() * customerStatuses.length)],
        total_orders: totalOrders,
        total_spent: Math.round(totalOrders * avgOrderValue * 100) / 100,
        join_date: randomDate(365),
        last_order_at: totalOrders > 0 ? randomDate(60) : null,
      });
    }
    await knex('customers').insert(customers);
    logger.info(`Inserted ${customers.length} customers`);

    // Seed Orders (300 orders)
    const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const orders = [];
    for (let i = 0; i < 300; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 5) + 1;
      const items = [];
      let total = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = product.price * quantity;
        total += itemTotal;
        items.push({
          productId: product.sku,
          name: product.name,
          quantity,
          price: product.price,
          total: Math.round(itemTotal * 100) / 100,
        });
      }

      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const orderAge = Math.floor(Math.random() * 60);
      const orderDate = daysAgo(orderAge);
      
      const shippedAt = status !== 'pending' && status !== 'cancelled' 
        ? daysAgo(orderAge - Math.floor(Math.random() * 3) - 1)
        : null;
      const deliveredAt = status === 'delivered'
        ? daysAgo(orderAge - Math.floor(Math.random() * 5) - 4)
        : null;

      orders.push({
        order_number: `ORD-${String(i + 1).padStart(6, '0')}`,
        customer_email: customer.email,
        customer_name: customer.name,
        items: JSON.stringify(items),
        total: Math.round(total * 100) / 100,
        status,
        order_date: orderDate,
        shipped_at: shippedAt,
        delivered_at: deliveredAt,
      });
    }
    await knex('orders').insert(orders);
    logger.info(`Inserted ${orders.length} orders`);

    logger.info('PostgreSQL seed completed successfully!');
    logger.info('Summary:');
    logger.info(`  - Users: ${users.length}`);
    logger.info(`  - Products: ${products.length}`);
    logger.info(`  - Customers: ${customers.length}`);
    logger.info(`  - Orders: ${orders.length}`);

  } catch (error) {
    logger.error('PostgreSQL seed failed:', error);
    throw error;
  } finally {
    await knex.destroy();
  }
}

// Run the seed
seedPostgres()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
