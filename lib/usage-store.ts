const FREE_USES_PER_MONTH = 3;

// In-memory store keyed by "cid:YYYY-MM" for monthly resets.
// For production, replace with a persistent store (e.g. Vercel KV, Redis, or a database).
const store = new Map<string, number>();

function monthKey(cid: string): string {
  const now = new Date();
  return `${cid}:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function isSubscriber(cid: string): boolean {
  // Extend this to check a real subscriber list (e.g. database or Shopify metafield).
  const subscriberIds = (process.env.SUBSCRIBER_CIDS ?? "").split(",").filter(Boolean);
  return subscriberIds.includes(cid);
}

export async function readUsage(cid: string): Promise<{ usesLeft: number; isSubscriber: boolean }> {
  if (isSubscriber(cid)) return { usesLeft: Infinity, isSubscriber: true };
  const key = monthKey(cid);
  const used = store.get(key) ?? 0;
  return { usesLeft: Math.max(0, FREE_USES_PER_MONTH - used), isSubscriber: false };
}

export async function decrementUsage(cid: string): Promise<{ usesLeft: number }> {
  if (isSubscriber(cid)) return { usesLeft: Infinity };
  const key = monthKey(cid);
  const used = store.get(key) ?? 0;
  const newUsed = Math.min(used + 1, FREE_USES_PER_MONTH);
  store.set(key, newUsed);
  return { usesLeft: Math.max(0, FREE_USES_PER_MONTH - newUsed) };
}
