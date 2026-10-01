import crypto from 'node:crypto';

function hmac(key: Uint8Array | string, data: string) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function hashHex(data: string | Uint8Array) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function credentials() {
  const endpoint = process.env.B2_ENDPOINT;
  const region = process.env.B2_REGION;
  const bucket = process.env.B2_BUCKET;
  const accessKey = process.env.B2_KEY_ID;
  const secretKey = process.env.B2_APPLICATION_KEY;
  if (!endpoint || !region || !bucket || !accessKey || !secretKey) throw new Error('B2_NOT_CONFIGURED');
  return { endpoint: endpoint.replace(/\/$/, ''), region, bucket, accessKey, secretKey };
}

export function objectUrl(key: string) {
  const { endpoint, bucket } = credentials();
  return `${endpoint}/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function signingHeaders(method: string, uri: string, bodyHash: string, query: string, contentType = '') {
  const { region, accessKey, secretKey } = credentials();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const host = new URL(uri).host;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${amzDate}\n` + (contentType ? `x-amz-content-type:${contentType}\n` : '');
  const signedHeaders = `host;x-amz-content-sha256;x-amz-date${contentType ? ';x-amz-content-type' : ''}`;
  const canonicalRequest = [method, new URL(uri).pathname, query, canonicalHeaders, signedHeaders, bodyHash].join('\n');
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hashHex(canonicalRequest)}`;
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  return { amzDate, authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}` };
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  const { endpoint, bucket } = credentials();
  const uri = `${endpoint}/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const payload = new Uint8Array(body);
  const bodyHash = hashHex(payload);
  const sig = signingHeaders('PUT', uri, bodyHash, '', contentType);
  const response = await fetch(uri, {
    method: 'PUT',
    headers: {
      host: new URL(uri).host,
      'x-amz-content-sha256': bodyHash,
      'x-amz-date': sig.amzDate,
      'x-amz-content-type': contentType,
      authorization: sig.authorization,
    },
    body: payload,
  });
  if (!response.ok) throw new Error(`B2_UPLOAD_${response.status}`);
  return { key, url: objectUrl(key) };
}


export function signedGetUrl(key: string, ttlSeconds = 300) {
  const { endpoint, region, bucket, accessKey, secretKey } = credentials();
  const uri = `${endpoint}/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const host = new URL(uri).host;
  const credential = `${accessKey}/${dateStamp}/${region}/s3/aws4_request`;
  const params = new URLSearchParams({ 'X-Amz-Algorithm':'AWS4-HMAC-SHA256','X-Amz-Credential':credential,'X-Amz-Date':amzDate,'X-Amz-Expires':String(ttlSeconds),'X-Amz-SignedHeaders':'host' });
  const canonicalQuery = [...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  const canonicalRequest = ['GET',new URL(uri).pathname,canonicalQuery,`host:${host}\n`,'host','UNSIGNED-PAYLOAD'].join('\n');
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hashHex(canonicalRequest)}`;
  const kDate = hmac(`AWS4${secretKey}`, dateStamp); const kRegion = hmac(kDate, region); const kService = hmac(kRegion, 's3'); const kSigning = hmac(kService, 'aws4_request');
  params.set('X-Amz-Signature', crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex'));
  return `${uri}?${[...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;
}
