import mongoose from "mongoose";

const keySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    plan: {
      type: String,
      required: true,
      enum: ["weekly", "monthly", "lifetime"],
      index: true,
    },
    status: {
      type: String,
      enum: ["unused", "used"],
      default: "unused",
      index: true,
    },
    assignedEmail: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    // Leave this field absent until a Gumroad sale claims the key. A sparse
    // unique index still indexes `null`, so defaulting it to null makes every
    // unclaimed key conflict with the first one.
    gumroadSaleId: { type: String, unique: true, sparse: true },
    gumroadOrderNumber: { type: String, default: null },
  },
  { timestamps: true }
);

keySchema.index({ plan: 1, status: 1 });

// In Next.js dev mode, this module can be re-evaluated on every hot reload.
// Re-registering the same Mongoose model throws "OverwriteModelError" —
// this guard reuses the existing model instead.
export default mongoose.models.Key || mongoose.model("Key", keySchema);
