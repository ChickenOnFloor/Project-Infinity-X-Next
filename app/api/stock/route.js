import { connectDB } from "@/lib/db";
import Key from "@/models/Key";

// Stock changes after every purchase, so this route must never be statically
// cached by Next.js or Vercel.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        // Prevent browser, intermediary CDN, and Vercel edge caches from
        // retaining a stock response after a key is sold.
        "Cache-Control": "no-store, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[stock] failed:", err);
    return Response.json({ error: "failed to load stock" }, { status: 500 });
  }
}
