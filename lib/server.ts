export function env(name: string, fallback?: string) {
  const value = process.env[name];
  if (value) return value;
  if (fallback !== undefined) return fallback;
  return undefined;
}

export function assertServerSecret(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}
