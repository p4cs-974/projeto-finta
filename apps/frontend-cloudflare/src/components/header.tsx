"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";
import { ChartLineIcon } from "./ui/chart-line";
import { SearchIcon, SearchIconHandle } from "./ui/search";
import { SessionAvatar } from "./session-avatar";
import { AuthSessionPayload } from "@/lib/auth";
import { Button } from "./ui/button";
import { LogoutIcon } from "./ui/logout";

interface HeaderProps {
  session: AuthSessionPayload;
}

export default function Header({ session }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const searchIconRef = useRef<SearchIconHandle>(null);

  if (pathname === "/login" || pathname === "/logout") {
    return null;
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      startTransition(() => {
        router.push("/login");
        router.refresh();
      });
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-row items-center gap-4 place-content-between px-4 py-4 mx-4 my-4 bg-card border border-border">
      {/*Logo*/}
      <Link
        href="/"
        className="flex gap-1 flex-row text-2xl font-medium items-center hover:opacity-80 transition-opacity"
      >
        <ChartLineIcon size={26} autoPlay />
        Finta
      </Link>

      {/*NavBar*/}
      <nav className="hidden md:flex items-center gap-2">
        <Link
          href="/search"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
          onMouseEnter={() => searchIconRef.current?.startAnimation()}
          onMouseLeave={() => searchIconRef.current?.stopAnimation()}
        >
          <SearchIcon ref={searchIconRef} size={14} />
          Search
        </Link>
      </nav>

      {/*Auth*/}
      <div className="flex flex-row gap-2 items-center">
        <SessionAvatar size={28} seed={`${session.name} | ${session.email}`} />
        {session.name.split(" ")[0]}
        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Sign out"
          className="px-0"
        >
          <LogoutIcon className={isLoggingOut ? "opacity-50" : ""} />
        </Button>
      </div>
    </div>
  );
}
