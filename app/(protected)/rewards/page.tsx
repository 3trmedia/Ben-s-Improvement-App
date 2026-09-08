"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader, Section, Card, ConfirmModal } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { getPointBalance, revokeExactPoints } from "@/lib/points";

type Reward = { id: string; name: string; image_url: string | null; cost: number; archived: boolean; starred: boolean };
type Activity = { id: string; source: string; points: number; label: string | null; created_at: string };

function byCost(list: Reward[]) {
  return [...list].sort((a, b) => a.cost - b.cost);
}

function RewardTile({
  reward,
  balance,
  onToggleStar,
  onRedeem,
  onDelete,
}: {
  reward: Reward;
  balance: number;
  onToggleStar: (r: Reward) => void;
  onRedeem: (r: Reward) => void;
  onDelete: (r: Reward) => void;
}) {
  const affordable = balance >= reward.cost;
  const pct = Math.min(100, Math.round((balance / reward.cost) * 100));
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-surface">
      {reward.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={reward.image_url} alt={reward.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-bg text-[12px] text-ink-soft">No image</div>
      )}

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
        <button
          onClick={() => onDelete(reward)}
          aria-label="Delete"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-[11px] text-white"
        >
          ✕
        </button>
        <button
          onClick={() => onToggleStar(reward)}
          aria-label={reward.starred ? "Unstar" : "Star — move to favorites"}
          className={`flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-[15px] ${
            reward.starred ? "text-warm" : "text-white/80"
          }`}
        >
          {reward.starred ? "★" : "☆"}
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-6">
        <p className="truncate text-[12.5px] font-medium text-white">{reward.name}</p>
        <div className="mt-1 flex items-center justify-between gap-1.5">
          <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-surface">
            {reward.cost} pts
          </span>
          <button
            onClick={() => onRedeem(reward)}
            disabled={!affordable}
            className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-surface disabled:bg-white/20 disabled:text-white/60"
          >
            {affordable ? "Redeem" : `${reward.cost - balance} to go`}
          </button>
        </div>
        {!affordable && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const refresh = async () => {
    const [bal, rewardsRes, activityRes] = await Promise.all([
      getPointBalance(),
      supabase.from("rewards").select("*").order("cost"),
      supabase.from("point_events").select("*").order("created_at", { ascending: false }).limit(10),
    ]);
    setBalance(bal);
    if (rewardsRes.data) setRewards(rewardsRes.data as Reward[]);
    if (activityRes.data) setActivity(activityRes.data as Activity[]);
  };

  useEffect(() => {
    refresh().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addReward = async () => {
    const costNum = Number(cost);
    if (!name.trim() || !costNum) return;
    setUploading(true);
    let image_url: string | null = null;
    if (file) {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("reward-images").upload(path, file);
      if (!uploadError) {
        image_url = supabase.storage.from("reward-images").getPublicUrl(path).data.publicUrl;
      }
    }
    const id = crypto.randomUUID();
    await supabase.from("rewards").insert({ id, name: name.trim(), cost: costNum, image_url });
    // Append locally instead of re-fetching balance + all rewards + activity.
    setRewards((prev) => [...prev, { id, name: name.trim(), cost: costNum, image_url, archived: false, starred: false }]);
    setName("");
    setCost("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    setAddOpen(false);
  };

  const toggleStar = async (reward: Reward) => {
    const starred = !reward.starred;
    setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, starred } : r)));
    await supabase.from("rewards").update({ starred }).eq("id", reward.id);
  };

  // Optimistic: balance, reward, and the activity feed update immediately;
  // the two writes fire in the background instead of a 3-query refresh().
  const redeem = (reward: Reward) => {
    if (balance < reward.cost) return;
    const label = `Redeemed: ${reward.name}`;
    setBalance((b) => b - reward.cost);
    setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, archived: true } : r)));
    setActivity((prev) => [{ id: crypto.randomUUID(), source: "redemption", points: -reward.cost, label, created_at: new Date().toISOString() }, ...prev].slice(0, 10));
    (async () => {
      await supabase.from("point_events").insert({ source: "redemption", source_id: reward.id, points: -reward.cost, label });
      await supabase.from("rewards").update({ archived: true }).eq("id", reward.id);
    })();
  };

  const undoRedeem = (reward: Reward) => {
    setBalance((b) => b + reward.cost);
    setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, archived: false } : r)));
    (async () => {
      await revokeExactPoints("redemption", reward.id);
      await supabase.from("rewards").update({ archived: false }).eq("id", reward.id);
    })();
  };

  const deleteReward = async (reward: Reward) => {
    setDeleteTarget(null);
    setRewards((prev) => prev.filter((r) => r.id !== reward.id));
    await supabase.from("rewards").delete().eq("id", reward.id);
  };

  if (loading) {
    return <PageHeader eyebrow="Earn" title="Rewards" subtitle="Loading…" />;
  }

  const favorites = byCost(rewards.filter((r) => !r.archived && r.starred));
  const active = byCost(rewards.filter((r) => !r.archived && !r.starred));
  const purchased = rewards.filter((r) => r.archived);

  return (
    <>
      <PageHeader eyebrow="Earn" title="Rewards" subtitle="Points from tasks, habits, goals, and logging — spent on what you actually want." />

      <Section title="Balance">
        <Card accent="accent" className="flex items-center justify-between">
          <p className="font-mono text-[32px] font-semibold tabular-nums">{balance}</p>
          <p className="text-[13px] text-ink-soft">points · ${(balance * 0.1).toFixed(2)}</p>
        </Card>
      </Section>

      <Section title="Add a reward">
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] text-ink-soft"
        >
          <span>{addOpen ? "Cancel" : "What do you want to add?"}</span>
          <span className="font-mono text-[11px]">{addOpen ? "▲" : "▼"}</span>
        </button>
        {addOpen && (
          <Card accent="none" className="mt-2.5">
            <div className="flex flex-col gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What do you want?"
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
              />
              <div className="flex gap-2">
                <input
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="Cost in points"
                  inputMode="numeric"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="min-w-0 flex-1 text-[12.5px] text-ink-soft file:mr-2 file:rounded-lg file:border-0 file:bg-bg file:px-2.5 file:py-1.5 file:text-[12px]"
                />
              </div>
              <button
                onClick={addReward}
                disabled={uploading}
                className="rounded-lg bg-accent py-2 text-[13px] font-medium text-surface disabled:opacity-50"
              >
                {uploading ? "Adding…" : "Add reward"}
              </button>
            </div>
          </Card>
        )}
      </Section>

      {favorites.length > 0 && (
        <Section title="Favorites">
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((r) => (
              <RewardTile key={r.id} reward={r} balance={balance} onToggleStar={toggleStar} onRedeem={redeem} onDelete={setDeleteTarget} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Save up for">
        {active.length === 0 ? (
          <p className="text-[13px] text-ink-soft">No rewards yet — add one above.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {active.map((r) => (
              <RewardTile key={r.id} reward={r} balance={balance} onToggleStar={toggleStar} onRedeem={redeem} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </Section>

      {purchased.length > 0 && (
        <Section title="Purchased">
          <div className="grid grid-cols-3 gap-2.5">
            {purchased.map((r) => (
              <div key={r.id} className="group relative aspect-square overflow-hidden rounded-lg border border-line opacity-60">
                {r.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_url} alt={r.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover grayscale" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-1">
                  <p className="truncate text-[10.5px] font-medium text-white">{r.name}</p>
                </div>
                <button
                  onClick={() => undoRedeem(r)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-white"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Recent activity">
        <div className="flex flex-col gap-1.5">
          {activity.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-[13px]">
              <span className="text-ink-soft">{a.label ?? a.source}</span>
              <span className={`font-mono tabular-nums ${a.points < 0 ? "text-danger" : "text-accent"}`}>
                {a.points > 0 ? "+" : ""}
                {a.points}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteReward(deleteTarget)}
      />
    </>
  );
}
