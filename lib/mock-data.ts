export type Entity = "3TR" | "Blackout" | "Personal";

export type EventColor = "accent" | "warm" | "danger" | "info";

export type CalEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  title: string;
  location?: string;
  color: EventColor;
};

export const events: CalEvent[] = [
  { id: "ev1", date: "2026-08-17", start: "9:00 AM", end: "9:30 AM", title: "Hoffman Tactical invoice sent", color: "info" },
  { id: "ev2", date: "2026-08-18", start: "9:00 AM", end: "9:30 AM", title: "Peak Defense kickoff call", location: "Zoom", color: "info" },
  { id: "ev3", date: "2026-08-19", start: "6:00 PM", end: "7:00 PM", title: "Gym — Push day", color: "accent" },
  { id: "ev4", date: "2026-08-20", start: "11:00 AM", end: "12:00 PM", title: "RNR testimonial shoot", location: "RNR HQ", color: "danger" },
  { id: "ev5", date: "2026-08-21", start: "10:00 AM", end: "10:30 AM", title: "Christian — RNR edit check-in", color: "info" },
  { id: "ev6", date: "2026-08-21", start: "1:00 PM", end: "2:00 PM", title: "Film Blackout format #3", color: "warm" },
  { id: "ev7", date: "2026-08-21", start: "6:00 PM", end: "7:00 PM", title: "Gym — Leg day", color: "accent" },
  { id: "ev8", date: "2026-08-22", start: "9:00 AM", end: "9:30 AM", title: "Payment follow-up: J&C", color: "info" },
  { id: "ev9", date: "2026-08-24", start: "3:00 PM", end: "4:00 PM", title: "J&C retainer check-in", location: "Call", color: "info" },
  { id: "ev10", date: "2026-08-26", start: "10:00 AM", end: "11:00 AM", title: "Discovery call — Darren / Alpine", color: "warm" },
  { id: "ev11", date: "2026-08-27", start: "1:00 PM", end: "2:00 PM", title: "Uptown Drapes showcase filming", location: "On-site", color: "danger" },
  { id: "ev12", date: "2026-08-28", start: "9:00 AM", end: "9:30 AM", title: "Weekly review", color: "accent" },
  { id: "ev13", date: "2026-08-31", start: "5:00 PM", end: "6:00 PM", title: "Hike / run club", color: "accent" },
];

export const todos = [
  {
    id: "t1",
    title: "Send Peak Defense the Shopify template draft",
    nextAction: "Export theme + write handoff notes",
    entity: "3TR" as Entity,
    priority: "high" as const,
    due: "Today",
  },
  {
    id: "t2",
    title: "Script this week's Blackout format #3",
    nextAction: "Outline hook + 3 beats",
    entity: "Blackout" as Entity,
    priority: "medium" as const,
    due: "Today",
  },
  {
    id: "t3",
    title: "Log yesterday's lifts",
    nextAction: "Pull numbers from notes app",
    entity: "Personal" as Entity,
    priority: "low" as const,
    due: "Today",
  },
  {
    id: "t4",
    title: "Follow up with Christian on RNR edit",
    nextAction: "Ask for ETA on cut #2",
    entity: "3TR" as Entity,
    priority: "high" as const,
    due: "This week",
  },
  {
    id: "t5",
    title: "Draft Q3 goals doc",
    nextAction: "Block 30 min, no calls",
    entity: "Personal" as Entity,
    priority: "medium" as const,
    due: "This week",
  },
];

// doneThisWeek / targetPerWeek is what drives each habit's progress bar —
// consistency, not a streak-guilt counter that resets to zero on a miss.
export const habits = [
  { id: "h1", label: "Gym session", cadence: "3–4x / week", targetPerWeek: 4, doneThisWeek: 3 },
  { id: "h2", label: "Hike or run club", cadence: "weekly", targetPerWeek: 1, doneThisWeek: 1 },
  { id: "h3", label: "Dance night", cadence: "weekly", targetPerWeek: 1, doneThisWeek: 0 },
  { id: "h4", label: "Protein target (150–185g)", cadence: "daily", targetPerWeek: 7, doneThisWeek: 5 },
  { id: "h5", label: "Meal prep rotation used", cadence: "weekly", targetPerWeek: 1, doneThisWeek: 1 },
  { id: "h6", label: "Peptide log", cadence: "daily", targetPerWeek: 7, doneThisWeek: 6 },
];

// Every goal carries a real metric behind its bar — a count, a weekly
// consistency rate, or a PR you're chasing — not a manual "how do I feel" slider.
export const goals = [
  {
    id: "g1",
    title: "Close 2 more revenue-share clients",
    note: "Blind spot: chasing leads reactively instead of a real pipeline cadence.",
    metric: { kind: "count" as const, current: 0, target: 2, unit: "clients" },
  },
  {
    id: "g3",
    title: "Hit gym 3–4x/week without a guilt spiral on off weeks",
    note: "Systems over motivation — pulled straight from the Habits tab, not tracked twice.",
    metric: { kind: "habit" as const, habitId: "h1" },
  },
  {
    id: "g4",
    title: "Bench 205 lb by end of quarter",
    note: "Last logged: 185 lb on Aug 18. Pulled from the Fitness log, not re-entered here.",
    metric: { kind: "pr" as const, current: 185, target: 205, unit: "lb" },
  },
];

// Auto-Mate lives here as a project under To-Do, not its own tab.
export const projects = [
  {
    id: "proj1",
    title: "Auto-Mate build",
    note: "Ship Blackout's 6-format system consistently before adding more automation on top of it.",
    phases: [
      { id: "a1", name: "Lead qualifier", status: "Live" },
      { id: "a2", name: "Calendar automation", status: "In progress" },
      { id: "a3", name: "Nurture sequences", status: "Planned" },
      { id: "a4", name: "Invoicing", status: "Planned" },
    ],
  },
];

export const ideaBank = [
  { id: "i1", tier: "Free", channel: "DP Ben B", hook: "Why most agencies underprice discovery calls" },
  { id: "i2", tier: "$100", channel: "Blackout", hook: "3-format teardown of a competitor's feed" },
  { id: "i3", tier: "$1,000", channel: "3TR IG", hook: "Client case study: Peak Defense before/after" },
];

export const productionPipeline = {
  Personal: [
    { id: "p1", title: "Agency pricing myths", stage: "Editing", editor: "Christian", format: "Talking head", due: "Aug 25" },
    { id: "p2", title: "Morning routine breakdown", stage: "Filmed", editor: "—", format: "Vlog cut", due: "Aug 28" },
  ],
  Blackout: [
    { id: "p3", title: "Format #3 — feed teardown", stage: "Scripted", editor: "—", format: "Format 3", due: "Today" },
    { id: "p4", title: "Format #1 — hook study", stage: "Posted", editor: "Upwork", format: "Format 1", due: "—" },
  ],
  Clients: {
    "Peak Defense": [
      { id: "p5", title: "Shopify launch teaser", stage: "Delivered", editor: "Christian", format: "Ad cut", due: "—" },
    ],
    "J&C": [
      { id: "p6", title: "Product spotlight reel", stage: "Idea", editor: "—", format: "Reel", due: "Aug 26" },
    ],
    "RNR": [
      { id: "p7", title: "Testimonial cut #2", stage: "Editor assigned", editor: "Christian", format: "Testimonial", due: "Today" },
    ],
    "Uptown Drapes": [
      { id: "p8", title: "Before/after showcase", stage: "Filmed", editor: "—", format: "Showcase", due: "Aug 27" },
    ],
    "Hoffman Tactical": [
      { id: "p9", title: "Range day recap", stage: "Posted", editor: "Upwork", format: "Recap", due: "—" },
    ],
  } as Record<string, { id: string; title: string; stage: string; editor: string; format: string; due: string }[]>,
};

export const brandMetrics = [
  { id: "m1", channel: "DP Ben B", followers: 8400, change: "+120 this week" },
  { id: "m2", channel: "Blackout IG", followers: 3100, change: "+64 this week" },
  { id: "m3", channel: "3TR IG", followers: 1950, change: "+18 this week" },
];

export const gear = [
  { id: "g1", item: "Sony A7IV", location: "Studio", checkedOut: false },
  { id: "g2", item: "Rode Wireless GO II", location: "With Christian", checkedOut: true },
  { id: "g3", item: "50mm Prime", location: "Studio", checkedOut: false },
  { id: "g4", item: "Softbox kit", location: "Uptown Drapes shoot", checkedOut: true },
];

export const clients = [
  { id: "c1", name: "Peak Defense", type: "Shopify template work", status: "Active", contract: "Flat fee", nextTouch: "Aug 22", payment: "Paid" },
  { id: "c2", name: "J&C", type: "Content retainer", status: "Active", contract: "Revenue share", nextTouch: "Aug 24", payment: "Outstanding" },
  { id: "c3", name: "RNR", type: "Video production", status: "Active", contract: "Flat fee", nextTouch: "Today", payment: "Paid" },
  { id: "c4", name: "Uptown Drapes", type: "Content retainer", status: "Active", contract: "Revenue share", nextTouch: "Aug 27", payment: "Paid" },
  { id: "c5", name: "Hoffman Tactical", type: "Brand refresh", status: "Delivered", contract: "Flat fee", nextTouch: "Sep 3", payment: "Invoiced" },
];

export const leads = [
  { id: "l1", name: "Darren / Alpine", referrer: "Jeffrey", stage: "Discovery call booked" },
  { id: "l2", name: "Ben Carson", referrer: "Jeffrey", stage: "Proposal sent" },
  { id: "l3", name: "Mckay", referrer: "Jeffrey", stage: "Warm intro" },
  { id: "l4", name: "Weston", referrer: "Jeffrey", stage: "Follow-up needed" },
];

export const revenueBuckets = [
  { id: "b1", label: "Profit", amount: 4200, tone: "accent" as const },
  { id: "b2", label: "Tax", amount: 1800, tone: "warm" as const },
  { id: "b3", label: "Reinvest", amount: 2100, tone: "neutral" as const },
];

export const revenueByClient = [
  { id: "r1", name: "Peak Defense", amount: 2400 },
  { id: "r2", name: "J&C", amount: 1600 },
  { id: "r3", name: "RNR", amount: 1900 },
  { id: "r4", name: "Uptown Drapes", amount: 1300 },
  { id: "r5", name: "Hoffman Tactical", amount: 900 },
];

// Planned exercises per day — the target the log below is checked against.
export const workoutDays = [
  {
    id: "w1",
    name: "Push Day",
    exercises: [
      { id: "e1", name: "Bench Press", targetSets: 4, targetReps: "6–8", targetWeight: "185 lb" },
      { id: "e2", name: "Overhead Press", targetSets: 3, targetReps: "8–10", targetWeight: "95 lb" },
      { id: "e3", name: "Incline DB Press", targetSets: 3, targetReps: "10–12", targetWeight: "60 lb" },
      { id: "e4", name: "Lateral Raise", targetSets: 3, targetReps: "12–15", targetWeight: "20 lb" },
    ],
  },
  {
    id: "w2",
    name: "Pull Day",
    exercises: [
      { id: "e5", name: "Deadlift", targetSets: 4, targetReps: "5", targetWeight: "275 lb" },
      { id: "e6", name: "Pull-Up", targetSets: 4, targetReps: "8–10", targetWeight: "BW" },
      { id: "e7", name: "Barbell Row", targetSets: 3, targetReps: "8–10", targetWeight: "155 lb" },
      { id: "e8", name: "Face Pull", targetSets: 3, targetReps: "15", targetWeight: "40 lb" },
    ],
  },
  {
    id: "w3",
    name: "Leg Day",
    exercises: [
      { id: "e9", name: "Back Squat", targetSets: 4, targetReps: "6–8", targetWeight: "225 lb" },
      { id: "e10", name: "Romanian Deadlift", targetSets: 3, targetReps: "8–10", targetWeight: "185 lb" },
      { id: "e11", name: "Walking Lunge", targetSets: 3, targetReps: "12/leg", targetWeight: "40 lb" },
    ],
  },
];

// Most recent logged session per exercise — what was actually done last time.
export const lastLogged: Record<string, { date: string; actualSets: number; actualReps: string; actualWeight: string }> = {
  e1: { date: "Aug 18", actualSets: 4, actualReps: "6,6,5,5", actualWeight: "185 lb" },
  e2: { date: "Aug 18", actualSets: 3, actualReps: "9,8,8", actualWeight: "95 lb" },
  e5: { date: "Aug 16", actualSets: 4, actualReps: "5,5,5,4", actualWeight: "275 lb" },
};

export const bodyLog = [
  { id: "bl1", date: "Aug 19", weight: "182.4 lb", note: "Ring recovery: 78" },
  { id: "bl2", date: "Aug 12", weight: "183.1 lb", note: "Ring recovery: 71" },
];
