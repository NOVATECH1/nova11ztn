export async function createDiditSession(vendorData: string, callback?: string) {
  const apiKey = process.env.DIDIT_API_KEY;
  const workflowId = process.env.DIDIT_WORKFLOW_ID;
  if (!apiKey || !workflowId) throw new Error("DIDIT_API_KEY and DIDIT_WORKFLOW_ID are required");
  const base = process.env.DIDIT_API_URL ?? "https://verification.didit.me";
  const response = await fetch(`${base}/v3/session/`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({ workflow_id: workflowId, vendor_data: vendorData, ...(callback ? { callback } : {}) }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? `Didit session failed: ${response.status}`);
  return body as { session_id: string; url: string };
}
