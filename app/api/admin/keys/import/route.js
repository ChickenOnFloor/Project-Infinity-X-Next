import { connectDB } from "@/lib/db";
import Key from "@/models/Key";
import { checkAdminAuth } from "@/lib/adminAuth";

const VALID_PLANS = ["weekly", "monthly", "lifetime"];

export async function POST(request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    await connectDB();

    const { plan, keys } = await request.json();

    if (!VALID_PLANS.includes(plan)) {
      return Response.json(
        { error: `plan must be one of: ${VALID_PLANS.join(", ")}` },
        { status: 400 }
      );
    }
    if (!Array.isArray(keys) || keys.length === 0) {
      return Response.json(
        { error: "keys must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    const cleaned = keys.map((k) => String(k).trim()).filter(Boolean);

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (const code of cleaned) {
      try {
        await Key.create({ code, plan, status: "unused" });
        inserted++;
      } catch (err) {
        if (err.code === 11000) {
          skipped++; // duplicate — already in stock
        } else {
          errors.push({ code, message: err.message });
        }
      }
    }

    const remaining = await Key.countDocuments({ plan, status: "unused" });

    return Response.json({ plan, submitted: cleaned.length, inserted, skipped, errors, remaining });
  } catch (err) {
    console.error("[admin] import failed:", err);
    return Response.json({ error: "import failed" }, { status: 500 });
  }
}
