import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SignOutButton from "@/components/SignOutButton";
import OfflineSync from "@/components/OfflineSync";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: appUser } = await supabase
    .from("app_users")
    .select("status")
    .eq("auth_user_id", user.id)
    .single();

  if (appUser?.status !== "approved") {
    redirect("/pending");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-line/60 bg-bg">
      <OfflineSync />
      <SignOutButton />
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
