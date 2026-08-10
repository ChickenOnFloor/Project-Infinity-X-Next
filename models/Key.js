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
    gumroadSaleId: { type: String, default: null, unique: true, sparse: true },
    gumroadOrderNumber: { type: String, default: null },
  },
  { timestamps: true }
);

keySchema.index({ plan: 1, status: 1 });

// In Next.js dev mode, this module can be re-evaluated on every hot reload.
// Re-registering the same Mongoose model throws "OverwriteModelError" —
// this guard reuses the existing model instead.
export default mongoose.models.Key || mongoose.model("Key", keySchema);
