"use client";

import { useState } from "react";
import { PageHeader, Section, Card, Pill, Segmented } from "@/components/ui";
import { clients, leads, revenueBuckets, revenueByClient } from "@/lib/mock-data";

const PAYMENT_TONE: Record<string, "accent" | "warm" | "danger"> = {
  Paid: "accent",
  Outstanding: "danger",
  Invoiced: "warm",
};

export default function ClientsPage() {
  const [tab, setTab] = useState<"clients" | "leads" | "financials">("clients");
  const maxRevenue = Math.max(...revenueByClient.map((r) => r.amount));

  return (
    <>
      <PageHeader eyebrow="CRM" title="Clients & Leads" subtitle="Who's paying, who might, who's owed." />

      <div className="px-5 pb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "clients", label: "Clients" },
            { value: "leads", label: "Leads" },
            { value: "financials", label: "Financials" },
          ]}
        />
      </div>

      {tab === "clients" && (
        <Section title={`Roster (${clients.length})`}>
          <div className="flex flex-col gap-2.5">
            {clients.map((c) => (
              <Card key={c.id} accent="none">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14.5px] font-medium">{c.name}</p>
                    <p className="text-[12.5px] text-ink-soft">{c.type}</p>
                  </div>
                  <Pill tone={PAYMENT_TONE[c.payment]}>{c.payment}</Pill>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Pill tone="accent">{c.status}</Pill>
                  <Pill tone="neutral">{c.contract}</Pill>
                  <Pill tone="neutral">Next: {c.nextTouch}</Pill>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {tab === "leads" && (
        <Section title={`Pipeline (${leads.length})`}>
          <div className="flex flex-col gap-2.5">
            {leads.map((l) => (
              <Card key={l.id} accent="warm">
                <p className="text-[14.5px] font-medium">{l.name}</p>
                <p className="mt-1 text-[12.5px] text-ink-soft">Referred by {l.referrer}</p>
                <div className="mt-2">
                  <Pill tone="warm">{l.stage}</Pill>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {tab === "financials" && (
        <>
          <Section title="This month, three buckets">
            <div className="grid grid-cols-3 gap-2.5">
              {revenueBuckets.map((b) => (
                <Card key={b.id} accent={b.tone === "neutral" ? "none" : b.tone} className="text-center">
                  <p className="font-mono text-[17px] font-medium tabular-nums">
                    ${b.amount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-soft">{b.label}</p>
                </Card>
              ))}
            </div>
          </Section>
          <Section title="Revenue by client">
            <Card accent="none" className="flex flex-col gap-3">
              {revenueByClient.map((r) => (
                <div key={r.id}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="font-medium">{r.name}</span>
                    <span className="font-mono tabular-nums text-ink-soft">
                      ${r.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(r.amount / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </Card>
          </Section>
        </>
      )}
    </>
  );
}
