const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let memoryServer = null;

/**
 * Connects to MongoDB.
 * - If MONGO_URI is set in .env, it connects to that database (local MongoDB or Atlas).
 * - Otherwise it starts a bundled MongoDB instance (mongodb-memory-server) that stores
 *   its data on disk in server/data/db, so the project runs without installing MongoDB.
 */
async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    // Always use the binary cached inside server/node_modules, whatever folder the server is started from
    process.env.MONGOMS_DOWNLOAD_DIR =
      process.env.MONGOMS_DOWNLOAD_DIR ||
      path.join(__dirname, '..', '..', 'node_modules', '.cache', 'mongodb-memory-server');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, '..', '..', 'data', 'db');
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
        port: 27027,
        // small, non-preallocated journal files keep the data folder tiny (default is ~300 MB)
        args: ['--wiredTigerEngineConfigString', 'log=(file_max=10MB,prealloc=false)'],
      },
    });
    uri = memoryServer.getUri();
    console.log('Started bundled MongoDB (data folder: server/data/db)');
  }

  // j: true -> every write is saved to the on-disk journal before MongoDB confirms it,
  // so data is not lost if the server is closed suddenly (e.g. Ctrl+C)
  await mongoose.connect(uri, { dbName: 'lostfound', writeConcern: { w: 1, j: true } });
  console.log('MongoDB connected');
}

async function disconnectDB() {
  if (memoryServer && mongoose.connection.readyState === 1) {
    await mongoose.connection.db.admin().command({ fsync: 1 }).catch(() => {});
  }
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop({ doCleanup: false });
}

module.exports = { connectDB, disconnectDB };
