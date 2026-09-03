"use client";

import { createClient } from "@/lib/supabase/client";

export default function PendingPage() {
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 border-x border-line/60 bg-bg px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-widest text-warm">Pending</p>
      <h1 className="font-display text-[1.5rem] font-medium">Waiting for approval</h1>
      <p className="max-w-xs text-[13.5px] text-ink-soft">
        Ben needs to approve your access before you can use this app. Check back later.
      </p>
      <button onClick={signOut} className="mt-2 text-[13px] text-ink-soft underline">
        Sign out
      </button>
    </div>
  );
}
