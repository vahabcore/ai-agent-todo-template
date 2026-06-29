import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable in .env.local"
    );
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? {
    conn: null,
    promise: null,
};

if (!global.mongoose) {
    global.mongoose = cached;
}

export async function dbConnect(): Promise<typeof mongoose> {
    if (cached.conn) {
        console.log("➡️ Using existing database connection (cached)");
        return cached.conn;
    }

    if (!cached.promise) {
        console.log("🚀 Creating a new connection promise...");
        cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
            console.log("✅ MongoDB successfully connected!");
            return mongoose;
        });
    } else {
        console.log("⏳ Waiting for an existing connection promise to resolve...");
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        console.error("❌ MongoDB connection error:", e);
        cached.promise = null; // Clear promise on error so Next.js tries again
        throw e;
    }

    return cached.conn;
}
