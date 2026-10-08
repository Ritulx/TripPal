// Run this script with: node scripts/testModels.js
// It creates one sample document per model, verifies indexes, then cleans up after itself.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { User, Category, Place, Review, LocalTip, SearchQuery } = require('../models');

const run = async () => {
  await connectDB();

  try {
    console.log('\n--- Creating sample Category ---');
    const category = await Category.create({
      name: 'Flower Shops',
      description: 'Florists and flower vendors',
      icon: 'Flower2',
    });
    console.log('Category created:', category.name, '| slug:', category.slug);

    console.log('\n--- Creating sample User ---');
    const user = await User.create({
      name: 'Ritul Test',
      email: `test.${Date.now()}@trippal.dev`,
      password: 'TestPassword123',
      role: 'local',
      homeLocation: { type: 'Point', coordinates: [79.1325, 12.9165] }, // Vellore, TN
    });
    console.log('User created:', user.email, '| password hashed:', user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

    console.log('\n--- Creating sample Place (near Vellore) ---');
    const place = await Place.create({
      name: 'Blossom Corner Florist',
      category: category._id,
      address: 'Gandhi Nagar, Vellore, Tamil Nadu',
      location: { type: 'Point', coordinates: [79.1350, 12.9180] },
      source: 'manual',
    });
    console.log('Place created:', place.name);

    console.log('\n--- Creating sample Review ---');
    const review = await Review.create({
      place: place._id,
      authorName: 'Anonymous Google User',
      rating: 5,
      text: 'The fresh lilies here are absolutely stunning, best in the area.',
      extractedKeywords: ['fresh', 'lilies'],
      source: 'google',
    });
    console.log('Review created, isPositive:', review.isPositive);

    console.log('\n--- Creating sample LocalTip ---');
    const tip = await LocalTip.create({
      place: place._id,
      local: user._id,
      tipText: 'Ask for the lilies in the back — they restock every Tuesday and are fresher.',
      tags: ['fresh lilies', 'restock tip'],
      categoryTag: 'Flower Shops',
      upvotes: [],
    });
    console.log('LocalTip created, netVotes:', tip.netVotes);

    console.log('\n--- Creating sample SearchQuery ---');
    const query = await SearchQuery.create({
      user: user._id,
      radius: 15,
      keyword: 'fresh lilies',
      category: category._id,
      location: { type: 'Point', coordinates: [79.1325, 12.9165] },
      resultCount: 1,
    });
    console.log('SearchQuery logged, radius:', query.radius, 'km');

    console.log('\n--- Verifying 2dsphere geospatial query works ---');
    const nearbyPlaces = await Place.find({
      location: {
        $geoWithin: {
          $centerSphere: [[79.1325, 12.9165], 20 / 6378.1], // 20km radius in radians
        },
      },
    });
    console.log(`Geospatial query returned ${nearbyPlaces.length} place(s) within 20km — expected 1`);

    console.log('\n--- Verifying text index search works ---');
    const textResults = await Place.find({ $text: { $search: 'florist lilies' } });
    console.log(`Text search returned ${textResults.length} place(s)`);

    console.log('\n--- Cleaning up test data ---');
    await Promise.all([
      User.deleteOne({ _id: user._id }),
      Category.deleteOne({ _id: category._id }),
      Place.deleteOne({ _id: place._id }),
      Review.deleteOne({ _id: review._id }),
      LocalTip.deleteOne({ _id: tip._id }),
      SearchQuery.deleteOne({ _id: query._id }),
    ]);
    console.log('Cleanup complete. All models validated successfully.\n');
  } catch (err) {
    console.error('\n❌ Model verification FAILED:', err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
};

run();