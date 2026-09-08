"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader, Section, Card, ConfirmModal } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { getPointBalance } from "@/lib/points";

type Reward = { id: string; name: string; image_url: string | null; cost: number; archived: boolean };
type Activity = { id: string; source: string; points: number; label: string | null; created_at: string };

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
    await supabase.from("rewards").insert({ name: name.trim(), cost: costNum, image_url });
    setName("");
    setCost("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    refresh();
  };

  const redeem = async (reward: Reward) => {
    if (balance < reward.cost) return;
    await supabase.from("point_events").insert({
      source: "redemption",
      source_id: reward.id,
      points: -reward.cost,
      label: `Redeemed: ${reward.name}`,
    });
    await supabase.from("rewards").update({ archived: true }).eq("id", reward.id);
    refresh();
  };

  const deleteReward = async (reward: Reward) => {
    setDeleteTarget(null);
    setRewards((prev) => prev.filter((r) => r.id !== reward.id));
    await supabase.from("rewards").delete().eq("id", reward.id);
  };

  if (loading) {
    return <PageHeader eyebrow="Earn" title="Rewards" subtitle="Loading…" />;
  }

  const active = rewards.filter((r) => !r.archived);
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
        <Card accent="none">
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
      </Section>

      <Section title="Save up for">
        <div className="flex flex-col gap-2.5">
          {active.length === 0 && <p className="text-[13px] text-ink-soft">No rewards yet — add one above.</p>}
          {active.map((r) => (
            <Card key={r.id} accent="none">
              <div className="flex items-center gap-3">
                {r.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_url} alt={r.name} className="h-14 w-14 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium">{r.name}</p>
                  <p className="font-mono text-[12.5px] tabular-nums text-ink-soft">{r.cost} pts</p>
                </div>
                <button
                  onClick={() => redeem(r)}
                  disabled={balance < r.cost}
                  className="rounded-lg bg-accent px-3 py-2 text-[12.5px] font-medium text-surface disabled:opacity-40"
                >
                  Redeem
                </button>
                <button onClick={() => setDeleteTarget(r)} aria-label="Delete" className="text-[13px] text-ink-soft">
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {purchased.length > 0 && (
        <Section title="Purchased">
          <div className="flex flex-col gap-2.5">
            {purchased.map((r) => (
              <Card key={r.id} accent="none" className="flex items-center gap-3 opacity-60">
                {r.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_url} alt={r.name} className="h-12 w-12 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium line-through">{r.name}</p>
                  <p className="font-mono text-[12px] tabular-nums text-ink-soft">{r.cost} pts</p>
                </div>
              </Card>
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
