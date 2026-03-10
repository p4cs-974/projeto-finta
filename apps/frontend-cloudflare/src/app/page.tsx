import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { SessionAvatar } from "@/components/session-avatar";
import { AUTH_COOKIE_NAME, getSessionFromCookieValue } from "@/lib/auth";

export default async function AppPage() {
  const cookieStore = await cookies();
  const session = getSessionFromCookieValue(
    cookieStore.get(AUTH_COOKIE_NAME)?.value,
  );

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-xl border border-border bg-card p-8 text-card-foreground">
        <div className="flex flex-col items-center gap-5 text-center">
          <SessionAvatar seed={`${session.name} | ${session.email}`} />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Finta
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Hello, {session.name}
            </h1>
            <p className="text-sm text-muted-foreground">{session.email}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
