"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const LOGIN_ERROR =
  "This account cannot log in here. Go to Tuttifruttimanagement.com.";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: LOGIN_ERROR };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .eq("stock_access", true)
    .single();

  if (!profile || profile.role !== "owner") {
    await supabase.auth.signOut();
    return { error: LOGIN_ERROR };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
