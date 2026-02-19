import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users to login
  if (!user && !pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-based routing for authenticated users
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .eq("stock_access", true)
      .single();

    // No stock access — sign out and redirect to login
    if (!profile && !pathname.startsWith("/login")) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const role = profile?.role;

    // Counter users: redirect to /count from any non-counter page
    if (role === "counter" && !pathname.startsWith("/count") && !pathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/count";
      return NextResponse.redirect(url);
    }

    // Non-counter users: redirect away from /count
    if (role !== "counter" && pathname.startsWith("/count")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Authenticated users on login page: redirect based on role
    if (pathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = role === "counter" ? "/count" : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/weekly-report|manifest.json|sw.js|workbox-.*\\.js).*)",
  ],
};
