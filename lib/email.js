import { Resend } from "resend";
import { sendViaNodemailer } from "./nodemailer.js";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL;

const PLAN_LABELS = {
  weekly: "Weekly",
  monthly: "Monthly",
  lifetime: "Lifetime",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendKeyEmail({ toEmail, plan, keyCode }) {
  const planLabel = PLAN_LABELS[plan] || plan;
  const safeKeyCode = escapeHtml(keyCode);
  const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  const copyUrl = appUrl ? `${appUrl}/redeem?key=${encodeURIComponent(keyCode)}` : null;
  const html = `
      <div style="font-family: -apple-system, sans-serif; background:#0a0a10; padding:32px; color:#ece9f7;">
        <div style="max-width:480px; margin:0 auto; background:#131320; border:1px solid rgba(139,92,246,0.25); border-radius:12px; padding:28px;">
          <h2 style="margin:0 0 4px; font-size:18px;">Project Infinity X</h2>
          <p style="color:#8d8ba3; font-size:13px; margin:0 0 20px;">${planLabel} plan — thanks for your purchase</p>
          <div style="background:#0d0d15; border:1px solid rgba(139,92,246,0.35); border-radius:8px; padding:16px; text-align:center; margin-bottom:20px;">
            <code style="font-size:16px; letter-spacing:0.03em; color:#22d3ee;">${keyCode}</code>
          </div>
          <p style="font-size:13px; color:#8d8ba3; line-height:1.6;">
            Join our Discord and run <strong>/redeem</strong> with this key to activate your plan.
          </p>
        </div>
      </div>
  `;

  const text = `Project Infinity X — ${planLabel} plan\n\nYour key: ${keyCode}\n\nJoin our Discord and run /redeem with this key to activate your plan.`;

  const professionalHtml = `
    <div style="margin:0;padding:32px 16px;background:#09090f;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;overflow:hidden;background:#151520;border:1px solid #2b2b3d;border-radius:16px;">
        <div style="padding:28px 32px 22px;background:#17122b;border-bottom:1px solid #2b2b3d;">
          <div style="margin-bottom:18px;color:#a78bfa;font-size:12px;font-weight:700;letter-spacing:1.8px;">PROJECT INFINITY X</div>
          <h1 style="margin:0;color:#fff;font-size:25px;line-height:1.25;">Your key is ready</h1>
          <p style="margin:10px 0 0;color:#b7b5c8;font-size:14px;line-height:1.55;">Thanks for your purchase. Your ${escapeHtml(planLabel)} plan key is below.</p>
        </div>
        <div style="padding:28px 32px 12px;">
          <p style="margin:0 0 10px;color:#b7b5c8;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Your activation key</p>
          <div style="padding:18px;background:#0c0c13;border:1px solid #393052;border-radius:10px;text-align:center;"><code style="color:#67e8f9;font-family:Consolas,Monaco,monospace;font-size:17px;font-weight:700;letter-spacing:0.6px;word-break:break-all;">${safeKeyCode}</code></div>
        </div>
        <div style="padding:12px 32px 26px;text-align:center;">${copyUrl ? `<a href="${copyUrl}" style="display:inline-block;padding:13px 22px;background:#8b5cf6;border-radius:8px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;">Copy key</a>` : ""}<p style="margin:14px 0 0;color:#8f8ca5;font-size:12px;line-height:1.5;">Save this key somewhere safe. You will need it to activate your plan.</p></div>
        <div style="padding:20px 32px 26px;border-top:1px solid #2b2b3d;"><p style="margin:0;color:#b7b5c8;font-size:13px;line-height:1.65;">Join our Discord and run <strong style="color:#fff;">/redeem</strong> with this key to activate your plan.</p></div>
      </div>
    </div>
  `;

  // If explicitly configured to use nodemailer, or Resend isn't configured,
  // send via SMTP fallback.
  if (process.env.EMAIL_PROVIDER === "nodemailer" || !resend) {
    try {
      const info = await sendViaNodemailer({
        from: FROM_EMAIL,
        to: toEmail,
        subject: `Your Project Infinity X key (${planLabel})`,
        text: `Project Infinity X — ${planLabel} plan\n\nYour key: ${keyCode}`,
        html: professionalHtml,
      });
      return info;
    } catch (err) {
      throw new Error(`Nodemailer failed to send key email: ${err.message || err}`);
    }
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Your Project Infinity X key (${planLabel})`,
    html: professionalHtml,
    text: `Project Infinity X — ${planLabel} plan\n\nYour key: ${keyCode}\n\nJoin our Discord and run /redeem with this key to activate your plan.`,
  });

  if (error) {
    throw new Error(`Resend failed to send key email: ${error.message || error}`);
  }
  return data;
}

export async function sendLowStockAlert({ plan, remaining }) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) return;
  if (process.env.EMAIL_PROVIDER === "nodemailer" || !resend) {
    try {
      await sendViaNodemailer({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `⚠️ Infinity X: ${plan} keys running low (${remaining} left)`,
        text: `Heads up — the "${plan}" plan has ${remaining} unused key(s) left in stock. Top it up soon.`,
      });
      return;
    } catch (err) {
      console.error("[email] nodemailer low-stock error:", err.message || err);
      return;
    }
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `⚠️ Infinity X: ${plan} keys running low (${remaining} left)`,
    text: `Heads up — the "${plan}" plan has ${remaining} unused key(s) left in stock. Top it up soon.`,
  });

  if (error) {
    console.error("[email] failed to send low-stock alert:", error.message || error);
  }
}

export async function sendOutOfStockAlert({ plan, buyerEmail, saleId }) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) return;
  if (process.env.EMAIL_PROVIDER === "nodemailer" || !resend) {
    try {
      await sendViaNodemailer({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `🚨 Infinity X: OUT OF STOCK for ${plan} — sale ${saleId} unfulfilled`,
        text: `A sale came in for the "${plan}" plan but there are no unused keys left.\n\nBuyer: ${buyerEmail}\nGumroad sale ID: ${saleId}\n\nYou need to top up stock and manually deliver a key to this buyer.`,
      });
      return;
    } catch (err) {
      console.error("[email] nodemailer out-of-stock error:", err.message || err);
      return;
    }
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `🚨 Infinity X: OUT OF STOCK for ${plan} — sale ${saleId} unfulfilled`,
    text: `A sale came in for the "${plan}" plan but there are no unused keys left.\n\nBuyer: ${buyerEmail}\nGumroad sale ID: ${saleId}\n\nYou need to top up stock and manually deliver a key to this buyer.`,
  });

  if (error) {
    console.error("[email] failed to send out-of-stock alert:", error.message || error);
  }
}
