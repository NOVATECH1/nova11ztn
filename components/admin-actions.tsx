"use client";
import { useState } from "react";

export function FulfillWaliyaButton({ id, failedBefore }: { id: string; failedBefore?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    if (failedBefore) {
      const confirmed = window.confirm("Check Waliya orders first. Waliya may have already created this order.");
      if (!confirmed) return;
    }
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/admin/store-orders/${id}/fulfill`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setMsg(j.providerRef ? `Sent · ${j.providerRef}` : "Sent");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return <span>
    <button className="btn btn--soft" disabled={busy} onClick={run}>{busy ? "Sending…" : "Send to Waliya"}</button>
    {msg && <small style={{ marginLeft: 8 }}>{msg}</small>}
  </span>;
}

export function CompleteManualButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  async function run() { setBusy(true); try { const r = await fetch(`/api/admin/store-orders/${id}/complete`, { method: "POST" }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setMsg("Completed"); } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); } }
  return <span><button className="btn btn--soft" disabled={busy} onClick={run}>{busy ? "Saving…" : "Mark complete"}</button>{msg && <small style={{ marginLeft: 8 }}>{msg}</small>}</span>;
}

export function CheckWaliyaStatusButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  async function run() { setBusy(true); try { const r = await fetch(`/api/admin/store-orders/${id}/status`); const j = await r.json(); if (!r.ok) throw new Error(j.error); setMsg(j.providerStatus || j.status); } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); } }
  return <span><button className="btn btn--soft" disabled={busy} onClick={run}>{busy ? "Checking…" : "Check status"}</button>{msg && <small style={{ marginLeft: 8 }}>{msg}</small>}</span>;
}

export function MarkPayoutPaidButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  async function run() { setBusy(true); try { const r = await fetch(`/api/admin/payouts/${id}/mark-paid`, { method: "POST" }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setMsg("Marked paid"); } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); } }
  return <span><button className="btn btn--soft" disabled={busy} onClick={run}>{busy ? "Saving…" : "Mark paid"}</button>{msg && <small style={{ marginLeft: 8 }}>{msg}</small>}</span>;
}
