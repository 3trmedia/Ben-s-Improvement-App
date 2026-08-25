import { NextResponse } from "next/server";
import ical, { type VEvent } from "node-ical";

export type CalendarApiEvent = {
  id: string;
  date: string; // YYYY-MM-DD, local
  start: string;
  end: string;
  title: string;
  location?: string;
};

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeLabel(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export async function GET() {
  const url = process.env.GOOGLE_CALENDAR_ICS_URL;
  if (!url) {
    return NextResponse.json({ events: [] as CalendarApiEvent[] });
  }

  try {
    const data = await ical.async.fromURL(url);
    const events: CalendarApiEvent[] = Object.values(data)
      .filter((item): item is VEvent => item?.type === "VEVENT" && !!(item as VEvent).start)
      .map((e) => {
        const start = e.start as Date;
        const end = (e.end as Date) ?? start;
        const allDay = e.datetype === "date";
        return {
          id: e.uid,
          date: toDateKey(start),
          start: allDay ? "All day" : toTimeLabel(start),
          end: allDay ? "" : toTimeLabel(end),
          title: e.summary?.toString() ?? "Untitled",
          location: e.location?.toString(),
        };
      });

    return NextResponse.json({ events });
  } catch (err) {
    console.error("Calendar fetch failed", err);
    return NextResponse.json({ events: [] as CalendarApiEvent[], error: "Failed to fetch calendar" }, { status: 502 });
  }
}
