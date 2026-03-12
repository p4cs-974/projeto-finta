import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Header from "@/components/header";
import { AUTH_COOKIE_NAME, getSessionFromCookieValue } from "@/lib/auth";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = getSessionFromCookieValue(
    cookieStore.get(AUTH_COOKIE_NAME)?.value,
  );

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Header session={session} />
      {children}
    </>
  );
}
