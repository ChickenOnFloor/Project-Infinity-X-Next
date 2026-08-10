import mongoose from "mongoose";
import dns from "dns";

// Some local networks/ISPs block or mishandle the DNS SRV lookups that
// mongodb+srv:// connection strings rely on, causing
// "querySrv ECONNREFUSED" errors. Forcing public DNS servers here fixes
// that for local development. Harmless on Vercel — its own network
// resolves fine either way.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Cache the connection on the global object. This does double duty:
// - On Vercel, serverless functions can be invoked many times against the
//   same warm container — without caching, every invocation would open a
//   new connection and quickly exhaust the connection pool.
// - In Next.js dev mode, hot-reloading re-runs this module on every file
//   change — without caching on `global`, you'd leak a new connection on
//   every save.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing from your environment variables");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
