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
    const uniqueCodes = [...new Set(cleaned)];
    const duplicateSubmitted = cleaned.length - uniqueCodes.length;

    const existingKeys = await Key.find({ code: { $in: uniqueCodes } }).select("code").lean();
    const duplicateDbCodes = existingKeys.map((doc) => doc.code);

    const codesToInsert = uniqueCodes.filter((code) => !duplicateDbCodes.includes(code));
    let inserted = 0;
    let skipped = duplicateSubmitted + duplicateDbCodes.length;
    const skippedKeys = [
      ...new Set(
        cleaned.filter((code, index) => cleaned.indexOf(code) !== index).concat(duplicateDbCodes)
      ),
    ];
    const errors = [];

    for (const code of codesToInsert) {
      try {
        await Key.create({ code, plan, status: "unused" });
        inserted++;
      } catch (err) {
        if (err.code === 11000) {
          skipped++;
          duplicateDbCodes.push(code);
          skippedKeys.push(code);
        } else {
          errors.push({ code, message: err.message });
        }
      }
    }

    const remaining = await Key.countDocuments({ plan, status: "unused" });

    return Response.json({
      plan,
      submitted: cleaned.length,
      inserted,
      skipped,
      duplicateSubmitted,
      duplicateDbCodes: [...new Set(duplicateDbCodes)],
      skippedKeys: [...new Set(skippedKeys)],
      errors,
      remaining,
    });
  } catch (err) {
    console.error("[admin] import failed:", err);
    return Response.json({ error: "import failed" }, { status: 500 });
  }
}
