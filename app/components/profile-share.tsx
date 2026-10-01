"use client";

import { useState } from "react";

export function ProfileShare({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return <button className="btn" type="button" onClick={copy}>{copied ? "Profile link copied" : "Copy profile link"}</button>;
}
