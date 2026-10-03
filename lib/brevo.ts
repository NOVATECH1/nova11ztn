export async function sendBrevoEmail(input: { to: string; name?: string; subject: string; html: string }) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    return { sent: false, reason: "Brevo environment not configured" } as const;
  }
  const base = process.env.BREVO_API_URL ?? "https://api.brevo.com/v3";
  const res = await fetch(`${base}/smtp/email`, {
    method: "POST",
    headers: { accept: "application/json", "api-key": process.env.BREVO_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: process.env.BREVO_SENDER_NAME ?? "ZTN" },
      to: [{ email: input.to, name: input.name }],
      subject: input.subject,
      htmlContent: input.html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo email failed: ${res.status}`);
  return { sent: true } as const;
}
