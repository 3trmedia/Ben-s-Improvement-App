"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 border-x border-line/60 bg-bg px-6 text-center">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Private</p>
        <h1 className="mt-1.5 font-display text-[1.7rem] font-medium leading-tight">
          Ben&apos;s Improvement App
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-soft">Sign in to continue.</p>
      </div>
      <button
        onClick={signIn}
        className="rounded-lg bg-accent px-5 py-3 text-[14px] font-medium text-surface"
      >
        Continue with Google
      </button>
    </div>
  );
}
