"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Section, Card, Pill, Segmented } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { brandMetrics, gear } from "@/lib/mock-data";

const STAGE_TONE: Record<string, "accent" | "warm" | "neutral" | "danger"> = {
  Idea: "neutral",
  Scripted: "neutral",
  Filmed: "warm",
  "Editor assigned": "warm",
  Editing: "warm",
  Delivered: "accent",
  Posted: "accent",
};

type ContentItem = {
  id: string;
  owner: string;
  title: string;
  stage: string;
  editor: string | null;
  format: string | null;
  due: string | null;
};
type Idea = { id: string; tier: string; channel: string; hook: string };

export default function ContentPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [ideaBank, setIdeaBank] = useState<Idea[]>([]);
  const [owner, setOwner] = useState<"Personal" | "Blackout" | "Clients">("Personal");
  const [client, setClient] = useState("");

  useEffect(() => {
    async function load() {
      const [itemsRes, ideasRes] = await Promise.all([
        supabase.from("content_items").select("*").order("sort_order"),
        supabase.from("idea_bank").select("*"),
      ]);
      if (itemsRes.data) setItems(itemsRes.data as ContentItem[]);
      if (ideasRes.data) setIdeaBank(ideasRes.data as Idea[]);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientNames = useMemo(
    () => Array.from(new Set(items.filter((i) => i.owner !== "Personal" && i.owner !== "Blackout").map((i) => i.owner))),
    [items]
  );

  useEffect(() => {
    if (!client && clientNames.length) setClient(clientNames[0]);
  }, [clientNames, client]);

  if (loading) {
    return <PageHeader eyebrow="Pipeline" title="Content" subtitle="Loading…" />;
  }

  const visibleItems =
    owner === "Clients" ? items.filter((i) => i.owner === client) : items.filter((i) => i.owner === owner);

  return (
    <>
      <PageHeader eyebrow="Pipeline" title="Content" subtitle="Idea Bank feeds Production, tagged by channel." />

      <div className="px-5 pb-5">
        <Segmented
          value={owner}
          onChange={setOwner}
          options={[
            { value: "Personal", label: "Personal" },
            { value: "Blackout", label: "Blackout" },
            { value: "Clients", label: "Clients" },
          ]}
        />
      </div>

      {owner === "Clients" && (
        <div className="flex gap-2 overflow-x-auto px-5 pb-5">
          {clientNames.map((name) => (
            <button
              key={name}
              onClick={() => setClient(name)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${
                client === name ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-soft"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <Section title={owner === "Clients" ? client || "Clients" : `${owner} pipeline`}>
        <div className="flex flex-col gap-2.5">
          {visibleItems.map((item) => (
            <Card key={item.id} accent="none">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14.5px] font-medium">{item.title}</p>
                <Pill tone={STAGE_TONE[item.stage] ?? "neutral"}>{item.stage}</Pill>
              </div>
              <p className="mt-1.5 text-[12.5px] text-ink-soft">
                {item.format} · Editor: {item.editor}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Idea bank">
        <div className="flex flex-col gap-2.5">
          {ideaBank.map((idea) => (
            <Card key={idea.id} accent="warm">
              <p className="text-[14px] font-medium">{idea.hook}</p>
              <div className="mt-2 flex gap-1.5">
                <Pill tone="warm">{idea.tier}</Pill>
                <Pill tone="neutral">{idea.channel}</Pill>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Brand metrics">
        <div className="flex flex-col gap-2.5">
          {brandMetrics.map((m) => (
            <Card key={m.id} accent="none" className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium">{m.channel}</p>
                <p className="text-[12px] text-ink-soft">{m.change}</p>
              </div>
              <p className="font-mono text-[15px] tabular-nums">{m.followers.toLocaleString()}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Gear">
        <div className="flex flex-col gap-2.5">
          {gear.map((g) => (
            <Card key={g.id} accent="none" className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium">{g.item}</p>
                <p className="text-[12px] text-ink-soft">{g.location}</p>
              </div>
              <Pill tone={g.checkedOut ? "warm" : "accent"}>{g.checkedOut ? "Checked out" : "In studio"}</Pill>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
