// backend/__tests__/integration/setup.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { beforeEach, afterAll } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.test to ensure MONGOMS_* vars are set before MongoMemoryServer is used
dotenv.config({ path: resolve(__dirname, "../../.env.test") });

let mongoServer;
let isSetupComplete = false;

// Singleton setup - only runs once even if imported by multiple test files
async function setup() {
  if (isSetupComplete) {
    return;
  }

  // Check if mongoose is already connected (maybe from a previous test file)
  if (mongoose.connection.readyState === 1) {
    isSetupComplete = true;
    return;
  }

  console.log("[Test Setup] Starting MongoMemoryServer...");

  try {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: process.env.MONGOMS_VERSION || "6.0.6",
        downloadDir: resolve(__dirname, "../../.mongodb-binaries"),
      },
    });

    const uri = mongoServer.getUri();
    console.log("[Test Setup] MongoMemoryServer started at:", uri);

    await mongoose.connect(uri);
    console.log("[Test Setup] Mongoose connected successfully");

    isSetupComplete = true;
  } catch (error) {
    console.error("[Test Setup] Failed to start MongoMemoryServer:", error);
    throw error;
  }
}

// Clean up all collections between tests
async function cleanupDatabase() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

// Run setup immediately
await setup();

// Register vitest hooks
beforeEach(async () => {
  await cleanupDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

export { mongoServer, cleanupDatabase };
