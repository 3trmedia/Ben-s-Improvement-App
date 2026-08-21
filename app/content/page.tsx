"use client";

import { useState } from "react";
import { PageHeader, Section, Card, Pill, Segmented } from "@/components/ui";
import { productionPipeline, ideaBank, brandMetrics, gear } from "@/lib/mock-data";

const STAGE_TONE: Record<string, "accent" | "warm" | "neutral" | "danger"> = {
  Idea: "neutral",
  Scripted: "neutral",
  Filmed: "warm",
  "Editor assigned": "warm",
  Editing: "warm",
  Delivered: "accent",
  Posted: "accent",
};

export default function ContentPage() {
  const [owner, setOwner] = useState<"Personal" | "Blackout" | "Clients">("Personal");
  const clientNames = Object.keys(productionPipeline.Clients);
  const [client, setClient] = useState(clientNames[0]);

  const items =
    owner === "Clients" ? productionPipeline.Clients[client] : productionPipeline[owner];

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
                client === name
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-soft"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <Section title={owner === "Clients" ? client : `${owner} pipeline`}>
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
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
              <Pill tone={g.checkedOut ? "warm" : "accent"}>
                {g.checkedOut ? "Checked out" : "In studio"}
              </Pill>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
