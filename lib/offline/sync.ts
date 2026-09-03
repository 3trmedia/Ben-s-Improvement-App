import { offlineDb, type OutboxItem } from "./db";
import { createClient } from "@/lib/supabase/client";

export async function cacheSet(key: string, data: unknown) {
  await offlineDb.cache.put({ key, data });
}

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  const row = await offlineDb.cache.get(key);
  return row?.data as T | undefined;
}

export async function queueMutation(item: Omit<OutboxItem, "id" | "createdAt">) {
  await offlineDb.outbox.add({ ...item, createdAt: Date.now() });
}

// Runs a Supabase write; if it fails (offline, dropped connection), the
// mutation is queued instead and replayed later by flushOutbox — the caller
// has already updated local state/cache optimistically either way.
export async function writeOrQueue(item: Omit<OutboxItem, "id" | "createdAt">) {
  if (!navigator.onLine) {
    await queueMutation(item);
    return;
  }
  try {
    const supabase = createClient();
    if (item.op === "insert") {
      const { error } = await supabase.from(item.table).insert(item.payload);
      if (error) throw error;
    } else if (item.match) {
      let q = supabase.from(item.table).update(item.payload);
      for (const [k, v] of Object.entries(item.match)) q = q.eq(k, v as string);
      const { error } = await q;
      if (error) throw error;
    }
  } catch {
    await queueMutation(item);
  }
}

// Replays queued mutations in order. Called once on reconnect — not polled —
// so nothing syncs passively while the connection is unreliable or metered.
export async function flushOutbox() {
  if (!navigator.onLine) return;
  const supabase = createClient();
  const items = await offlineDb.outbox.orderBy("id").toArray();

  for (const item of items) {
    try {
      if (item.op === "insert") {
        const { error } = await supabase.from(item.table).insert(item.payload);
        if (error) throw error;
      } else if (item.match) {
        let q = supabase.from(item.table).update(item.payload);
        for (const [k, v] of Object.entries(item.match)) q = q.eq(k, v as string);
        const { error } = await q;
        if (error) throw error;
      }
      if (item.id != null) await offlineDb.outbox.delete(item.id);
    } catch (err) {
      console.error("Sync failed, will retry on next reconnect", item, err);
      break; // preserve order — stop rather than skip ahead
    }
  }
}
