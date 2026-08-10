import { connectDB } from "@/lib/db";
import Key from "@/models/Key";
import { sendKeyEmail, sendLowStockAlert, sendOutOfStockAlert } from "@/lib/email";

const LOW_STOCK_THRESHOLD = 5;

function getPlanMap() {
  return {
    [process.env.GUMROAD_PRODUCT_WEEKLY]: "weekly",
    [process.env.GUMROAD_PRODUCT_MONTHLY]: "monthly",
    [process.env.GUMROAD_PRODUCT_LIFETIME]: "lifetime",
  };
}

export async function POST(request) {
  try {
    await connectDB();

    // Gumroad's Ping webhook sends application/x-www-form-urlencoded.
    // formData() parses that correctly in a Next.js route handler.
    const form = await request.formData();
    const body = Object.fromEntries(form.entries());

    const permalink = body.permalink || body.short_product_id;
    const buyerEmail = body.email;
    const saleId = body.sale_id;
    const orderNumber = body.order_number;
    const isTest = body.test === "true" || body.test === true;

    if (!permalink || !buyerEmail || !saleId) {
      console.warn("[webhook] missing required fields, ignoring:", body);
      return new Response("ignored: missing fields", { status: 200 });
    }

    const plan = getPlanMap()[permalink];
    if (!plan) {
      console.warn(`[webhook] unrecognized product permalink: ${permalink}`);
      return new Response("ignored: unrecognized product", { status: 200 });
    }

    // Idempotency guard — Gumroad may retry the same ping.
    const alreadyProcessed = await Key.findOne({ gumroadSaleId: saleId });
    if (alreadyProcessed) {
      console.log(`[webhook] sale ${saleId} already processed, skipping`);
      return new Response("already processed", { status: 200 });
    }

    // Atomically claim the oldest unused key for this plan.
    const key = await Key.findOneAndUpdate(
      { plan, status: "unused" },
      {
        $set: {
          status: "used",
          assignedEmail: buyerEmail,
          assignedAt: new Date(),
          gumroadSaleId: saleId,
          gumroadOrderNumber: orderNumber || null,
        },
      },
      { new: true, sort: { createdAt: 1 } }
    );

    if (!key) {
      console.error(`[webhook] OUT OF STOCK for plan "${plan}" — sale ${saleId}`);
      await sendOutOfStockAlert({ plan, buyerEmail, saleId });
      return new Response("out of stock, admin alerted", { status: 200 });
    }

    if (!isTest) {
      await sendKeyEmail({ toEmail: buyerEmail, plan, keyCode: key.code });
    } else {
      console.log(`[webhook] test purchase for ${plan}, key ${key.code} claimed but not emailed`);
    }

    const remaining = await Key.countDocuments({ plan, status: "unused" });
    if (remaining <= LOW_STOCK_THRESHOLD) {
      await sendLowStockAlert({ plan, remaining });
    }

    console.log(`[webhook] delivered ${plan} key to ${buyerEmail} (sale ${saleId})`);
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[webhook] unhandled error:", err);
    // 200 even on error so Gumroad doesn't retry-storm — log it and fix it.
    return new Response("error logged", { status: 200 });
  }
}
