"use client";

import { useState, useEffect } from "react";
import { Terminal } from "lucide-react";

const PLAN_LABELS = { weekly: "Weekly", monthly: "Monthly", lifetime: "Lifetime" };

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [authStatus, setAuthStatus] = useState(null); // { type, message }
  const [connecting, setConnecting] = useState(false);

  const [stock, setStock] = useState(null);

  const [plan, setPlan] = useState("weekly");
  const [keysText, setKeysText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  async function apiFetch(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        "x-admin-key": adminKey,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  async function loadStock() {
    try {
      const data = await apiFetch("/api/admin/stock");
      setStock(data);
    } catch (err) {
      setStock(null);
      setAuthStatus({ type: "err", message: `Failed to load stock: ${err.message}` });
    }
  }

  async function handleConnect() {
    if (!adminKey.trim()) {
      setAuthStatus({ type: "err", message: "Enter your admin key first." });
      return;
    }
    setConnecting(true);
    try {
      await apiFetch("/api/admin/stock");
      setConnected(true);
      setAuthStatus({ type: "ok", message: "Connected." });
      await loadStock();
    } catch (err) {
      setConnected(false);
      setAuthStatus({ type: "err", message: `Connection failed: ${err.message}` });
    } finally {
      setConnecting(false);
    }
  }

  async function handleImport() {
    const keys = keysText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (keys.length === 0) {
      setImportStatus({ type: "err", message: "Paste at least one key first." });
      return;
    }

    setImporting(true);
    setImportStatus({ type: "info", message: `Submitting ${keys.length} key(s)…` });

    try {
      const result = await apiFetch("/api/admin/keys/import", {
        method: "POST",
        body: JSON.stringify({ plan, keys }),
      });
      setImportStatus({
        type: "ok",
        message: `Done — inserted ${result.inserted}, skipped ${result.skipped} duplicate(s). ${result.remaining} unused ${plan} key(s) now in stock.${
          result.duplicateDbCodes && result.duplicateDbCodes.length > 0
            ? ` Duplicate existing key(s): ${result.duplicateDbCodes.join(", ")}`
            : ""
        }`,
      });
      setKeysText("");
      await loadStock();
    } catch (err) {
      setImportStatus({ type: "err", message: `Failed: ${err.message}` });
    } finally {
      setImporting(false);
    }
  }

  const keyCount = keysText.split("\n").map((l) => l.trim()).filter(Boolean).length;

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <Terminal size={18} color="var(--cyan)" />
        <h1 style={{ fontFamily: "var(--mono)", fontSize: 18, color: "var(--cyan)" }}>
          PROJECT <span style={{ color: "var(--violet)" }}>INFINITY X</span>
        </h1>
      </div>
      <p className="admin-subtitle">// admin_panel — key stock management</p>

      <div className="admin-card">
        <h2>
          <span style={{ fontFamily: "var(--mono)", color: "var(--violet)", fontWeight: 500, fontSize: 12 }}>
            01.
          </span>{" "}
          Connect
        </h2>
        <div className="admin-field">
          <label htmlFor="admin-key">Admin Key</label>
          <input
            type="password"
            id="admin-key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="your ADMIN_API_KEY"
          />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="admin-btn admin-btn-primary" onClick={handleConnect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect"}
          </button>
          <span className="admin-hint">Nothing is stored — re-enter this each time you reload.</span>
        </div>
        {authStatus && (
          <div className={`admin-status show admin-status-${authStatus.type}`}>{authStatus.message}</div>
        )}
      </div>

      {connected && (
        <>
          <div className="admin-card">
            <h2 style={{ justifyContent: "space-between" }}>
              <span>
                <span style={{ fontFamily: "var(--mono)", color: "var(--violet)", fontWeight: 500, fontSize: 12 }}>
                  02.
                </span>{" "}
                Current Stock
              </span>
              <button
                className="admin-btn"
                style={{ background: "transparent", border: "1px solid var(--card-border)", color: "var(--text-dim)", fontSize: 12, padding: "6px 12px" }}
                onClick={loadStock}
              >
                Refresh
              </button>
            </h2>
            <div className="admin-stock-grid">
              {["weekly", "monthly", "lifetime"].map((p) => {
                const info = stock?.[p] || { unused: 0, used: 0 };
                const unusedClass = info.unused <= 0 ? "zero" : info.unused <= 5 ? "low" : "";
                return (
                  <div className="admin-stock-cell" key={p}>
                    <div className="plan-name">{PLAN_LABELS[p]}</div>
                    <div className={`unused ${unusedClass}`}>{info.unused}</div>
                    <div className="used">{info.used} redeemed</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-card">
            <h2>
              <span style={{ fontFamily: "var(--mono)", color: "var(--violet)", fontWeight: 500, fontSize: 12 }}>
                03.
              </span>{" "}
              Add Keys
            </h2>
            <div className="admin-field">
              <label htmlFor="plan-select">Plan</label>
              <select id="plan-select" value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="keys-input">Keys (one per line)</label>
              <textarea
                id="keys-input"
                value={keysText}
                onChange={(e) => setKeysText(e.target.value)}
                placeholder={"INFX-WK-9F3KQ2\nINFX-WK-7XPL01\nINFX-WK-2MZC88"}
              />
              <div className="admin-hint">
                Duplicate keys already in the database are automatically skipped — safe to paste an
                overlapping list.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="admin-btn admin-btn-primary" onClick={handleImport} disabled={importing}>
                {importing ? "Adding…" : "Add keys"}
              </button>
              {keyCount > 0 && (
                <span className="admin-hint">
                  {keyCount} key{keyCount === 1 ? "" : "s"} entered
                </span>
              )}
            </div>
            {importStatus && (
              <div className={`admin-status show admin-status-${importStatus.type}`}>{importStatus.message}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
