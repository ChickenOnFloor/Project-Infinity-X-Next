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

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("[stock] failed:", err);
    return Response.json({ error: "failed to load stock" }, { status: 500 });
  }
}
