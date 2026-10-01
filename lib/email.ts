import { db } from './db';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

type SendEmailInput = {
  to: string;
  subject: string;
  title: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  eventKey: string;
  cta?: { label: string; url: string };
};

function esc(value: string) {
  return value.replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]!));
}

function sender() {
  const email = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM;
  if (!email) throw new Error('BREVO_SENDER_EMAIL_NOT_CONFIGURED');
  return {
    email,
    name: process.env.BREVO_SENDER_NAME || 'ZTN',
  };
}

export function buildEmailHtml(input: Pick<SendEmailInput, 'title' | 'preheader' | 'htmlBody' | 'cta'>) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cta = input.cta
    ? `<p style="margin:24px 0"><a href="${esc(input.cta.url)}" style="display:inline-block;background:#38a9e8;color:#fff;text-decoration:none;padding:11px 17px;border-radius:10px;font-weight:700">${esc(input.cta.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f7fafc;color:#17232d;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${esc(input.preheader || input.title)}</div><div style="max-width:620px;margin:0 auto;padding:28px 16px"><div style="background:#fff;border:1px solid #dce6eb;border-radius:14px;overflow:hidden"><div style="padding:18px 22px;border-bottom:1px solid #dce6eb"><div style="font-size:20px;font-weight:800;letter-spacing:-.04em">ZTN <span style="color:#38a9e8">Store</span></div></div><div style="padding:26px 22px"><div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#1788c5;font-weight:800">ZTN Store &amp; Marketplace</div><h1 style="font-size:26px;line-height:1.15;margin:8px 0 14px">${esc(input.title)}</h1><div style="font-size:15px;line-height:1.65">${input.htmlBody}</div>${cta}</div><div style="padding:16px 22px;border-top:1px solid #dce6eb;color:#6b7b86;font-size:12px">${esc(process.env.BREVO_SENDER_NAME || 'ZTN')} · <a href="${esc(appUrl)}" style="color:#1788c5">${esc(appUrl)}</a></div></div></div></body></html>`;
}

export async function sendEmail(input: SendEmailInput) {
  const existing = await db.emailDelivery.findUnique({ where: { eventKey: input.eventKey } }).catch(() => null);
  if (existing?.status === 'SENT') return { skipped: false, duplicate: true, messageId: existing.messageId };

  const provider = 'brevo';
  if (!process.env.BREVO_API_KEY) {
    if (process.env.DEMO_MODE === 'true') return { skipped: true, demo: true };
    throw new Error('BREVO_API_KEY_NOT_CONFIGURED');
  }

  let record = existing;
  if (record) {
    record = await db.emailDelivery.update({ where: { id: record.id }, data: { attempts: { increment: 1 }, status: 'PENDING', error: null } });
  } else {
    try {
      record = await db.emailDelivery.create({ data: { eventKey: input.eventKey, provider, recipient: input.to, subject: input.subject, attempts: 1 } });
    } catch {
      record = await db.emailDelivery.findUnique({ where: { eventKey: input.eventKey } });
      if (!record) throw new Error('EMAIL_DELIVERY_RECORD_FAILED');
      if (record.status === 'SENT') return { skipped: false, duplicate: true, messageId: record.messageId };
    }
  }

  try {
    const body: Record<string, unknown> = {
      sender: sender(),
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: buildEmailHtml(input),
      textContent: input.textBody,
      tags: ['ztn', input.eventKey.split(':')[0]],
    };
    const replyTo = process.env.BREVO_REPLY_TO;
    if (replyTo) body.replyTo = { email: replyTo };

    const response = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': process.env.BREVO_API_KEY, 'Idempotency-Key': input.eventKey },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`BREVO_${response.status}`);
    const messageId = typeof payload?.messageId === 'string' ? payload.messageId : null;
    await db.emailDelivery.update({ where: { id: record.id }, data: { status: 'SENT', messageId } });
    return { skipped: false, duplicate: false, messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'EMAIL_SEND_FAILED';
    await db.emailDelivery.update({ where: { id: record.id }, data: { status: 'FAILED', error: message } }).catch(() => {});
    throw error;
  }
}

export async function notifyAdmin(input: { subject: string; title: string; htmlBody: string; textBody: string; eventKey: string; cta?: { label: string; url: string } }) {
  return sendEmail({ ...input, to: process.env.ADMIN_EMAIL || 'muhdinnovel2@gmail.com' });
}

export async function notifyCustomer(input: { to: string; subject: string; title: string; htmlBody: string; textBody: string; eventKey: string; cta?: { label: string; url: string } }) {
  return sendEmail(input);
}

export async function sendStoreOrderCreated(args: { orderNumber: string; product: string; packageName: string; price: number; referenceNumber?: string | null; fulfillmentData?: Record<string, unknown> | null }) {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const details = Object.entries(args.fulfillmentData || {}).map(([k,v]) => `<div><strong>${esc(k)}:</strong> ${esc(String(v ?? ''))}</div>`).join('');
  const textDetails = Object.entries(args.fulfillmentData || {}).map(([k,v]) => `${k}: ${String(v ?? '')}`).join('\n');
  return notifyAdmin({
    eventKey: `store-order-created:${args.orderNumber}`,
    subject: `New ZTN Store order ${args.orderNumber}`,
    title: 'New Official Store order',
    htmlBody: `<p>Order <strong>${esc(args.orderNumber)}</strong> was created.</p><p><strong>Product:</strong> ${esc(args.product)}<br><strong>Package:</strong> ${esc(args.packageName)}<br><strong>Price:</strong> ${args.price.toLocaleString('en-ET')} ETB</p><div style="margin-top:14px;padding-top:14px;border-top:1px solid #dce6eb">${details || '<em>No fulfillment field supplied.</em>'}</div><p style="margin-top:14px"><strong>Payment reference:</strong> ${esc(args.referenceNumber || 'Not supplied')}</p>`,
    textBody: `Order ${args.orderNumber}\nProduct: ${args.product}\nPackage: ${args.packageName}\nPrice: ${args.price} ETB\n${textDetails}\nPayment reference: ${args.referenceNumber || 'Not supplied'}`,
    cta: { label: 'Open Admin', url: `${url}/admin` },
  });
}

export async function sendOrderStatusEmail(args: { to: string; orderNumber: string; status: string; event: string; title: string; message: string }) {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return notifyCustomer({
    to: args.to,
    eventKey: `order-status:${args.orderNumber}:${args.event}`,
    subject: `ZTN order ${args.orderNumber} — ${args.title}`,
    title: args.title,
    htmlBody: `<p>${esc(args.message)}</p><p><strong>Order:</strong> ${esc(args.orderNumber)}<br><strong>Status:</strong> ${esc(args.status)}</p>`,
    textBody: `${args.message}\nOrder: ${args.orderNumber}\nStatus: ${args.status}`,
    cta: { label: 'Open ZTN', url },
  });
}

export async function sendSubscriptionActivatedEmail(args: { to: string; tier: string; durationLabel: string; price: number; gifted?: boolean; paymentRef?: string }) {
  const eventKey = args.paymentRef ? `subscription-activated:${args.paymentRef}` : `subscription-activated:${args.to}:${args.tier}:${args.durationLabel}:${args.gifted ? 'gift' : 'paid'}`;
  return notifyCustomer({
    to: args.to,
    eventKey,
    subject: `Your ZTN ${args.tier === 'PREMIUM_PLUS' ? 'Premium+' : 'Premium'} access is active`,
    title: 'Subscription activated',
    htmlBody: `<p>Your ${args.tier === 'PREMIUM_PLUS' ? 'Premium+' : 'Premium'} access is now active for <strong>${esc(args.durationLabel)}</strong>.</p><p>${args.gifted ? '<strong>Gifted by ZTN Official</strong>.' : `<strong>Price:</strong> ${args.price.toLocaleString('en-ET')} ETB`}</p>`,
    textBody: `Your ${args.tier} access is active for ${args.durationLabel}.${args.gifted ? ' Gifted by ZTN Official.' : ` Price: ${args.price} ETB.`}`,
  });
}

export async function sendKycResultEmail(args: { to: string; status: 'VERIFIED' | 'REJECTED' | 'REVOKED' }) {
  const titles = { VERIFIED: 'Identity verification completed', REJECTED: 'Verification rejected', REVOKED: 'Verification revoked' } as const;
  const messages = { VERIFIED: 'Your ZTN identity verification is complete. Seller and other KYC-gated permissions are now available where applicable.', REJECTED: 'Verification rejected. Please re-upload your verification information.', REVOKED: 'Your previous verification has been revoked by ZTN. Please review your account and complete verification again if required.' } as const;
  return notifyCustomer({ to: args.to, eventKey: `kyc-result:${args.to}:${args.status}`, subject: `ZTN — ${titles[args.status]}`, title: titles[args.status], htmlBody: `<p>${esc(messages[args.status])}</p>`, textBody: messages[args.status] });
}


export async function sendMarketplaceOrderCreated(args: { to: string; orderNumber: string; title: string; price: number }) {
  return notifyCustomer({
    to: args.to,
    eventKey: `marketplace-order-created:${args.orderNumber}`,
    subject: `ZTN marketplace order ${args.orderNumber}`,
    title: 'Marketplace order created',
    htmlBody: `<p>Your marketplace order <strong>${esc(args.orderNumber)}</strong> has been created.</p><p><strong>Listing:</strong> ${esc(args.title)}<br><strong>Price:</strong> ${args.price.toLocaleString('en-ET')} ETB</p><p>Complete the payment flow from ZTN to continue.</p>`,
    textBody: `Marketplace order ${args.orderNumber} has been created. Listing: ${args.title}. Price: ${args.price} ETB.`,
    cta: { label: 'Open Marketplace', url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace` },
  });
}

export async function sendMarketplaceStatusEmail(args: { to: string; orderNumber: string; status: string; title: string; message: string }) {
  return notifyCustomer({
    to: args.to,
    eventKey: `marketplace-status:${args.orderNumber}:${args.status}`,
    subject: `ZTN marketplace order ${args.orderNumber} — ${args.title}`,
    title: args.title,
    htmlBody: `<p>${esc(args.message)}</p><p><strong>Order:</strong> ${esc(args.orderNumber)}<br><strong>Status:</strong> ${esc(args.status)}</p>`,
    textBody: `${args.message}\nOrder: ${args.orderNumber}\nStatus: ${args.status}`,
    cta: { label: 'Open ZTN', url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' },
  });
}

export async function sendSecurityAlertEmail(args: { to: string; title: string; message: string; eventKey: string }) {
  return notifyCustomer({
    to: args.to,
    eventKey: args.eventKey,
    subject: `ZTN security — ${args.title}`,
    title: args.title,
    htmlBody: `<p>${esc(args.message)}</p>`,
    textBody: args.message,
  });
}

export async function sendWelcomeEmail(args: { to: string; displayName: string }) {
  return notifyCustomer({
    to: args.to,
    eventKey: `welcome:${args.to}`,
    subject: 'Welcome to ZTN Store & Marketplace',
    title: 'Welcome to ZTN',
    htmlBody: `<p>Welcome, <strong>${esc(args.displayName)}</strong>.</p><p>You can browse the Official Store, explore the Marketplace and manage your account from ZTN.</p>`,
    textBody: `Welcome to ZTN, ${args.displayName}. Browse the Official Store, explore the Marketplace and manage your account from ZTN.`,
    cta: { label: 'Open ZTN', url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' },
  });
}
