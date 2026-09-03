"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const supabase = createClient();
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  return (
    <button
      onClick={signOut}
      className="fixed right-3 top-3 z-50 rounded-full border border-line bg-surface/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-soft backdrop-blur"
    >
      Sign out
    </button>
  );
}
