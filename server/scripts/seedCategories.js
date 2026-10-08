require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Restaurants', slug: 'restaurants', icon: 'UtensilsCrossed', description: 'Restaurants, cafes, and eateries' },
  { name: 'Grocery', slug: 'grocery', icon: 'ShoppingCart', description: 'Grocery shops and supermarkets' },
  { name: 'Barbers', slug: 'barbers', icon: 'Scissors', description: 'Barber shops and salons' },
  { name: 'Florists', slug: 'florists', icon: 'Flower2', description: 'Flower shops' },
  { name: 'Hardware', slug: 'hardware', icon: 'Hammer', description: 'Hardware and tool shops' },
  { name: 'Bakeries', slug: 'bakeries', icon: 'Cookie', description: 'Bakeries and dessert shops' },
];

const run = async () => {
  await connectDB();
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
      console.log(`✅ Upserted category: ${cat.name}`);
    }
    console.log('\nAll default categories seeded.');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();