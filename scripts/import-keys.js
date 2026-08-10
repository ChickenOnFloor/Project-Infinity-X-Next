/**
 * Bulk-import pre-generated keys into MongoDB.
 *
 * Usage:
 *   node scripts/import-keys.js weekly ./keys/weekly.txt
 *   node scripts/import-keys.js monthly ./keys/monthly.txt
 *   node scripts/import-keys.js lifetime ./keys/lifetime.txt
 *
 * Each .txt file should have ONE key per line.
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const VALID_PLANS = ["weekly", "monthly", "lifetime"];

const keySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    plan: { type: String, required: true, enum: VALID_PLANS },
    status: { type: String, enum: ["unused", "used"], default: "unused" },
    assignedEmail: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    gumroadSaleId: { type: String, unique: true, sparse: true },
    gumroadOrderNumber: { type: String, default: null },
  },
  { timestamps: true }
);
const Key = mongoose.models.Key || mongoose.model("Key", keySchema);

async function main() {
  const [, , plan, filePath] = process.argv;

  if (!plan || !filePath) {
    console.error("Usage: node scripts/import-keys.js <weekly|monthly|lifetime> <path-to-txt-file>");
    process.exit(1);
  }
  if (!VALID_PLANS.includes(plan)) {
    console.error(`Invalid plan "${plan}". Must be one of: ${VALID_PLANS.join(", ")}`);
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(fullPath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    console.error("File is empty — nothing to import.");
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing — check your .env.local file.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);

  let inserted = 0;
  let skipped = 0;

  for (const code of lines) {
    try {
      await Key.create({ code, plan, status: "unused" });
      inserted++;
    } catch (err) {
      if (err.code === 11000 && err.keyPattern?.code === 1) {
        skipped++;
      } else {
        console.error(`Failed to insert "${code}":`, err.message);
      }
    }
  }

  console.log(`\nDone. Plan: ${plan}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (already existed): ${skipped}`);

  await mongoose.connection.close();
}

main();
