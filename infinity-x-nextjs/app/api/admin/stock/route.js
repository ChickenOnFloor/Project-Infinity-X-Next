import { connectDB } from "@/lib/db";
import Key from "@/models/Key";
import { checkAdminAuth } from "@/lib/adminAuth";

const VALID_PLANS = ["weekly", "monthly", "lifetime"];

export async function GET(request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    await connectDB();

    const result = {};
    for (const plan of VALID_PLANS) {
      const unused = await Key.countDocuments({ plan, status: "unused" });
      const used = await Key.countDocuments({ plan, status: "used" });
      result[plan] = { unused, used };
    }

    return Response.json(result);
  } catch (err) {
    console.error("[admin] stock lookup failed:", err);
    return Response.json({ error: "failed to load stock" }, { status: 500 });
  }
}
