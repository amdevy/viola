import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin auth — handle separately, no locale routing
  if (pathname.startsWith("/admin") || pathname === "/login") {
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
      data: { session },
    } = await supabase.auth.getSession();

    if (!session && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return supabaseResponse;
  }

  // All other routes — apply locale routing
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|favicon|.*\\..*).*)"],
};
