import { connectDB } from "@/lib/db";
import Key from "@/models/Key";

export async function GET() {
  try {
    await connectDB();

    const plans = ["weekly", "monthly", "lifetime"];
    const result = {};
    for (const plan of plans) {
      result[plan] = await Key.countDocuments({ plan, status: "unused" });
    }

    return Response.json(result);
  } catch (err) {
    console.error("[stock] failed:", err);
    return Response.json({ error: "failed to load stock" }, { status: 500 });
  }
}
