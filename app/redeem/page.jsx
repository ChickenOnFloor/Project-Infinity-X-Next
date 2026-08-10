"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

export default function RedeemPage() {
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(null);

  useEffect(() => {
    setKey(new URLSearchParams(window.location.search).get("key") || "");
  }, []);

  async function copyKey() {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopied(true);
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#09090f", color: "#f4f4f5", fontFamily: "Arial, sans-serif" }}>
      <section style={{ width: "min(100%, 520px)", padding: 32, textAlign: "center", background: "#151520", border: "1px solid #2b2b3d", borderRadius: 16 }}>
        <KeyRound size={28} color="#67e8f9" style={{ marginBottom: 14 }} />
        <p style={{ margin: "0 0 8px", color: "#a78bfa", fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>PROJECT INFINITY X</p>
        <h1 style={{ margin: "0 0 10px", fontSize: 24 }}>Copy your activation key</h1>
        <p style={{ margin: "0 0 22px", color: "#b7b5c8", lineHeight: 1.5 }}>Copy it, then run <strong>/redeem</strong> in Discord.</p>
        {key === null ? null : key ? (
          <>
            <code style={{ display: "block", padding: 16, marginBottom: 16, overflowWrap: "anywhere", color: "#67e8f9", background: "#0c0c13", border: "1px solid #393052", borderRadius: 10, fontWeight: 700 }}>{key}</code>
            <button type="button" onClick={copyKey} style={{ border: 0, borderRadius: 8, padding: "13px 22px", background: "#8b5cf6", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
              {copied ? <><Check size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />Copied</> : <><Copy size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />Copy key</>}
            </button>
          </>
        ) : <p style={{ color: "#fca5a5" }}>No key was provided.</p>}
      </section>
    </main>
  );
}
