"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { relativeTime } from "@/lib/format";
import { EVENT_CATALOG } from "@/lib/seed";
import { Badge, Card, PageHeader } from "@/components/ui";

export function DevelopersPage() {
  const s = useStore();
  const [selected, setSelected] = useState<string | null>(s.events[0]?.id ?? null);
  const event = s.events.find((e) => e.id === selected);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Developers"
        description="Downstream systems subscribe to the engine through signed webhooks. Every state change emits an event so consumers never poll."
      />

      <Card className="mb-6" pad={false}>
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Endpoints</h2>
        </div>
        {s.endpoints.map((ep) => (
          <div key={ep.id} className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 first:border-t-0">
            <div className="min-w-0">
              <code className="block truncate text-sm text-[var(--text)]">{ep.url}</code>
              <div className="mt-1 flex flex-wrap gap-1">
                {ep.events.map((e) => (
                  <span key={e} className="rounded bg-[var(--slate-soft)] px-1.5 py-0.5 text-[10px] text-[var(--slate-text)]">{e}</span>
                ))}
              </div>
            </div>
            <Badge tone={ep.status === "enabled" ? "green" : "slate"} dot>{ep.status}</Badge>
          </div>
        ))}
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3" pad={false}>
          <div className="border-b border-[var(--border)] px-5 py-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">Event log</h2>
          </div>
          <ul className="max-h-[480px] overflow-y-auto">
            {s.events.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelected(e.id)}
                  className={`flex w-full items-center justify-between border-t border-[var(--border)] px-5 py-2.5 text-left first:border-t-0 hover:bg-[var(--surface-2)] ${
                    selected === e.id ? "bg-[var(--surface-2)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        e.status === "delivered" ? "bg-[var(--green)]" : e.status === "failed" ? "bg-[var(--red)]" : "bg-[var(--amber)]"
                      }`}
                    />
                    <code className="text-xs text-[var(--text)]">{e.type}</code>
                  </div>
                  <span className="text-[10px] text-[var(--faint)]">{relativeTime(e.created)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Payload</h2>
          {event ? (
            <pre className="overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs leading-relaxed text-white/90">
{`{
  "id": "${event.id}",
  "type": "${event.type}",
  "created": "${event.created}",
  "delivery": "${event.status}",
  "data": {
    "object": "${event.object}",
    "summary": "${event.summary}"
  }
}`}
            </pre>
          ) : (
            <p className="text-sm text-[var(--muted)]">Select an event.</p>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Event catalog</h2>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_CATALOG.map((e) => (
            <code key={e} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--muted)]">{e}</code>
          ))}
        </div>
      </Card>
    </div>
  );
}
