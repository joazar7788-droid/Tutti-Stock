import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/lib/context/user-context";
import { NavBar } from "@/components/nav-bar";
import { OfflineBanner } from "@/components/offline-banner";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <UserProvider
      value={{
        userId: user.id,
        email: user.email ?? "",
        profile,
        isOwner: profile.role === "owner",
      }}
    >
      <div className="min-h-dvh flex flex-col">
        <NavBar />
        <OfflineBanner />
        <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
