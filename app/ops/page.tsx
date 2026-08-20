"use client";

import { PageHeader, Section, Card, Pill } from "@/components/ui";
import { automationRoadmap, gear, brandMetrics } from "@/lib/mock-data";

const STATUS_TONE: Record<string, "accent" | "warm" | "neutral"> = {
  Live: "accent",
  "In progress": "warm",
  Planned: "neutral",
};

export default function OpsPage() {
  return (
    <>
      <PageHeader eyebrow="Lower priority" title="Ops" subtitle="Real, but not what's bottlenecking you today." />

      <Section title="Auto-Mate roadmap">
        <div className="flex flex-col gap-2.5">
          {automationRoadmap.map((a) => (
            <Card key={a.id} accent="none" className="flex items-center justify-between">
              <p className="text-[14px] font-medium">{a.name}</p>
              <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill>
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
              <p className="font-mono text-[15px] tabular-nums">
                {m.followers.toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Gear inventory">
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
