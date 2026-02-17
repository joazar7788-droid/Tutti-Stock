import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/lib/context/user-context";
import { SignOutButton } from "./sign-out-button";

export default async function CounterLayout({
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
        isCounter: profile.role === "counter",
      }}
    >
      <div className="min-h-dvh flex flex-col">
        <header className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-brand-600">Tutti Stock Count</h1>
          <SignOutButton />
        </header>
        <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
