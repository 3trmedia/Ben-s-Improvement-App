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

// Multiple private iCal feeds, comma-separated, blended into one event
// stream (GOOGLE_CALENDAR_ICS_URLS). GOOGLE_CALENDAR_ICS_URL (singular) is
// still honored for backward compatibility and simply gets folded in too.
function calendarUrls(): string[] {
  const list = (process.env.GOOGLE_CALENDAR_ICS_URLS ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  const single = process.env.GOOGLE_CALENDAR_ICS_URL?.trim();
  if (single && !list.includes(single)) list.push(single);
  return list;
}

export async function GET() {
  const urls = calendarUrls();
  if (urls.length === 0) {
    return NextResponse.json({ events: [] as CalendarApiEvent[] });
  }

  try {
    const results = await Promise.allSettled(urls.map((url) => ical.async.fromURL(url)));

    const events: CalendarApiEvent[] = [];
    let anyFailed = false;
    results.forEach((result, calendarIndex) => {
      if (result.status === "rejected") {
        console.error("Calendar fetch failed", urls[calendarIndex], result.reason);
        anyFailed = true;
        return;
      }
      Object.values(result.value)
        .filter((item): item is VEvent => item?.type === "VEVENT" && !!(item as VEvent).start)
        .forEach((e) => {
          const start = e.start as Date;
          const end = (e.end as Date) ?? start;
          const allDay = e.datetype === "date";
          events.push({
            // Prefix with the calendar index -- the same event uid could
            // theoretically repeat across two independent feeds.
            id: `${calendarIndex}:${e.uid}`,
            date: toDateKey(start),
            start: allDay ? "All day" : toTimeLabel(start),
            end: allDay ? "" : toTimeLabel(end),
            title: e.summary?.toString() ?? "Untitled",
            location: e.location?.toString(),
          });
        });
    });

    // Only surface an error if every calendar failed -- a blended view
    // shouldn't go blank just because one of several feeds is down.
    if (anyFailed && events.length === 0) {
      return NextResponse.json({ events: [] as CalendarApiEvent[], error: "Failed to fetch calendar" }, { status: 502 });
    }
    return NextResponse.json({ events });
  } catch (err) {
    console.error("Calendar fetch failed", err);
    return NextResponse.json({ events: [] as CalendarApiEvent[], error: "Failed to fetch calendar" }, { status: 502 });
  }
}
