const mongoose = require('mongoose');

let mongodInstance = null;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  mongoose.set('strictQuery', true);

  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      console.warn(`[db] Could not connect to MONGO_URI (${err.message}).`);
    }
  }

  // If local/external MongoDB connection fails, attempt in-memory MongoDB fallback
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('[db] Starting in-memory MongoDB instance for local development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memUri = mongodInstance.getUri();
      await mongoose.connect(memUri);
      console.log(`[db] Connected to in-memory MongoDB successfully: ${memUri}`);

      // Seed demo data only if explicitly requested via SEED_DEMO=true
      if (process.env.SEED_DEMO === 'true') {
        try {
          const seed = require('../utils/seed');
          await seed();
          console.log('[db] In-memory database seeded with demo data!');
        } catch (seedErr) {
          console.warn('[db] Auto-seeding skipped or failed:', seedErr.message);
        }
      } else {
        console.log('[db] Clean database initialized for real user data (auto-seeding disabled).');
      }
      return;
    } catch (memErr) {
      console.error('[db] In-memory MongoDB failed to start:', memErr.message);
    }
  }

  console.error('[db] MongoDB connection failed. Exiting.');
  process.exit(1);
}

module.exports = connectDB;
