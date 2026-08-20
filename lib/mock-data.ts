export type Entity = "3TR" | "Blackout" | "Personal";

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

export const habits = [
  { id: "h1", label: "Gym session", cadence: "3–4x / week" },
  { id: "h2", label: "Hike or run club", cadence: "weekly" },
  { id: "h3", label: "Dance night", cadence: "weekly" },
  { id: "h4", label: "Protein target (150–185g)", cadence: "daily" },
  { id: "h5", label: "Meal prep rotation used", cadence: "weekly" },
  { id: "h6", label: "Peptide log", cadence: "daily" },
];

export const goals = [
  {
    id: "g1",
    title: "Close 2 more revenue-share clients",
    note: "Blind spot: chasing leads reactively instead of a real pipeline cadence.",
  },
  {
    id: "g2",
    title: "Ship Blackout's 6-format system consistently",
    note: "Blind spot: don't build more infrastructure before this is running on its own.",
  },
  {
    id: "g3",
    title: "Hit gym 3–4x/week without a guilt spiral on off weeks",
    note: "Systems over motivation.",
  },
];

export const ideaBank = [
  { id: "i1", tier: "Free", channel: "DP Ben B", hook: "Why most agencies underprice discovery calls" },
  { id: "i2", tier: "$100", channel: "Blackout", hook: "3-format teardown of a competitor's feed" },
  { id: "i3", tier: "$1,000", channel: "3TR IG", hook: "Client case study: Peak Defense before/after" },
];

export const productionPipeline = {
  Personal: [
    { id: "p1", title: "Agency pricing myths", stage: "Editing", editor: "Christian", format: "Talking head" },
    { id: "p2", title: "Morning routine breakdown", stage: "Filmed", editor: "—", format: "Vlog cut" },
  ],
  Blackout: [
    { id: "p3", title: "Format #3 — feed teardown", stage: "Scripted", editor: "—", format: "Format 3" },
    { id: "p4", title: "Format #1 — hook study", stage: "Posted", editor: "Upwork", format: "Format 1" },
  ],
  Clients: {
    "Peak Defense": [
      { id: "p5", title: "Shopify launch teaser", stage: "Delivered", editor: "Christian", format: "Ad cut" },
    ],
    "J&C": [
      { id: "p6", title: "Product spotlight reel", stage: "Idea", editor: "—", format: "Reel" },
    ],
    "RNR": [
      { id: "p7", title: "Testimonial cut #2", stage: "Editor assigned", editor: "Christian", format: "Testimonial" },
    ],
    "Uptown Drapes": [
      { id: "p8", title: "Before/after showcase", stage: "Filmed", editor: "—", format: "Showcase" },
    ],
    "Hoffman Tactical": [
      { id: "p9", title: "Range day recap", stage: "Posted", editor: "Upwork", format: "Recap" },
    ],
  } as Record<string, { id: string; title: string; stage: string; editor: string; format: string }[]>,
};

export const clients = [
  { id: "c1", name: "Peak Defense", type: "Shopify template work", status: "Active", contract: "Flat fee", nextTouch: "Aug 22", payment: "Paid" },
  { id: "c2", name: "J&C", type: "Content retainer", status: "Active", contract: "Revenue share", nextTouch: "Aug 24", payment: "Outstanding" },
  { id: "c3", name: "RNR", type: "Video production", status: "Active", contract: "Flat fee", nextTouch: "Aug 21", payment: "Paid" },
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

export const workoutDays = [
  {
    id: "w1",
    name: "Push Day",
    exercises: [
      { id: "e1", name: "Bench Press", sets: 4, reps: "6–8", weight: "185 lb" },
      { id: "e2", name: "Overhead Press", sets: 3, reps: "8–10", weight: "95 lb" },
      { id: "e3", name: "Incline DB Press", sets: 3, reps: "10–12", weight: "60 lb" },
      { id: "e4", name: "Lateral Raise", sets: 3, reps: "12–15", weight: "20 lb" },
    ],
  },
  {
    id: "w2",
    name: "Pull Day",
    exercises: [
      { id: "e5", name: "Deadlift", sets: 4, reps: "5", weight: "275 lb" },
      { id: "e6", name: "Pull-Up", sets: 4, reps: "8–10", weight: "BW" },
      { id: "e7", name: "Barbell Row", sets: 3, reps: "8–10", weight: "155 lb" },
      { id: "e8", name: "Face Pull", sets: 3, reps: "15", weight: "40 lb" },
    ],
  },
  {
    id: "w3",
    name: "Leg Day",
    exercises: [
      { id: "e9", name: "Back Squat", sets: 4, reps: "6–8", weight: "225 lb" },
      { id: "e10", name: "Romanian Deadlift", sets: 3, reps: "8–10", weight: "185 lb" },
      { id: "e11", name: "Walking Lunge", sets: 3, reps: "12/leg", weight: "40 lb" },
    ],
  },
];

export const automationRoadmap = [
  { id: "a1", name: "Lead qualifier", status: "Live" },
  { id: "a2", name: "Calendar automation", status: "In progress" },
  { id: "a3", name: "Nurture sequences", status: "Planned" },
  { id: "a4", name: "Invoicing", status: "Planned" },
];

export const gear = [
  { id: "g1", item: "Sony A7IV", location: "Studio", checkedOut: false },
  { id: "g2", item: "Rode Wireless GO II", location: "With Christian", checkedOut: true },
  { id: "g3", item: "50mm Prime", location: "Studio", checkedOut: false },
  { id: "g4", item: "Softbox kit", location: "Uptown Drapes shoot", checkedOut: true },
];

export const brandMetrics = [
  { id: "m1", channel: "DP Ben B", followers: 8400, change: "+120 this week" },
  { id: "m2", channel: "Blackout IG", followers: 3100, change: "+64 this week" },
  { id: "m3", channel: "3TR IG", followers: 1950, change: "+18 this week" },
];
