"use client";

import { useRef } from "react";
import Link from "next/link";

import { ChartLineIcon, type ChartLineIconHandle } from "./ui/chart-line";
import { SearchIcon, type SearchIconHandle } from "./ui/search";
import { SessionAvatar } from "./session-avatar";
import { LogoutIcon, type LogoutIconHandle } from "./ui/logout";
import type { AuthSessionPayload } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import StarIcon from "./ui/star-icon";
import type { AnimatedIconHandle } from "./ui/types";
import LayoutDashboardIcon from "./ui/layout-dashboard-icon";

interface HeaderProps {
  session: AuthSessionPayload;
}

export default function Header({ session }: HeaderProps) {
  const searchIconRef = useRef<SearchIconHandle>(null);
  const starIconRef = useRef<AnimatedIconHandle>(null);
  const dashboardIconRef = useRef<AnimatedIconHandle>(null);
  const logoutIconRef = useRef<LogoutIconHandle>(null);
  const logoIconRef = useRef<ChartLineIconHandle>(null);
  return (
    <header className="mx-4 my-4 flex flex-row items-center gap-4 border border-border bg-card px-4 py-4 place-content-between">
      <Link
        href="/"
        className="flex flex-row items-center gap-2 text-2xl font-medium transition-opacity hover:opacity-80"
        onMouseEnter={() => logoIconRef.current?.startAnimation()}
        onMouseLeave={() => logoIconRef.current?.stopAnimation()}
      >
        <ChartLineIcon ref={logoIconRef} size={26} />
        Finta
      </Link>

      <nav className="hidden items-center gap-2 md:flex">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 border border-transparent px-2 py-1 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted/50"
          onMouseEnter={() => dashboardIconRef.current?.startAnimation()}
          onMouseLeave={() => dashboardIconRef.current?.stopAnimation()}
        >
          <LayoutDashboardIcon ref={dashboardIconRef} size={14} />
          Dashboard
        </Link>
        <Link
          href="/search"
          className="group inline-flex items-center gap-2 border border-transparent px-2 py-1 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted/50"
          onMouseEnter={() => searchIconRef.current?.startAnimation()}
          onMouseLeave={() => searchIconRef.current?.stopAnimation()}
        >
          <SearchIcon ref={searchIconRef} size={14} />
          Buscar
        </Link>
        <Link
          href="/favoritos"
          className="group inline-flex items-center gap-2 border border-transparent px-2 py-1 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted/50"
          onMouseEnter={() => starIconRef.current?.startAnimation()}
          onMouseLeave={() => starIconRef.current?.stopAnimation()}
        >
          <StarIcon ref={starIconRef} size={14} />
          Favoritos
        </Link>
      </nav>

      <div className="flex flex-row items-center gap-3">
        <SessionAvatar size={28} seed={`${session.name} | ${session.email}`} />
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-foreground">
            {session.name.split(" ")[0]}
          </p>
          <p className="text-xs text-muted-foreground">{session.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="group inline-flex items-center gap-2 border border-transparent px-2 py-1 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted/50"
            onMouseEnter={() => logoutIconRef.current?.startAnimation()}
            onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
          >
            <LogoutIcon ref={logoutIconRef} size={14} />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
