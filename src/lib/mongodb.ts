/* ============================================================
   MongoDB Connection — Singleton with caching
   ============================================================ */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env");
}

interface MongoCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoCache: MongoCache | undefined;
}

const cached: MongoCache = global.mongoCache || { conn: null, promise: null };

if (!global.mongoCache) {
  global.mongoCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  // Build indexes once per process. In production `autoIndex` is disabled, so we
  // explicitly ensure indexes here to guarantee the compound indexes exist and
  // the queries stay covered. `createIndexes` is idempotent and cheap if they
  // already exist.
  try {
    // Ensure models are registered before creating indexes
    // Import the models to register them with mongoose
    if (!mongoose.models.Project) {
      await import("@/lib/models/project");
    }
    if (!mongoose.models.User) {
      await import("@/lib/models/user");
    }
    
    await Promise.all([
      cached.conn.model("Project").createIndexes(),
      cached.conn.model("User").createIndexes(),
    ]);
  } catch (e) {
    // Index creation must not break the request path; log and continue.
    console.error("Index creation warning:", e);
  }

  return cached.conn;
}
