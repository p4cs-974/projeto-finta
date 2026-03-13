import Link from "next/link";

import { ChartLineIcon } from "./ui/chart-line";
import { SearchIcon } from "./ui/search";
import { SessionAvatar } from "./session-avatar";
import { Button } from "./ui/button";
import { LogoutIcon } from "./ui/logout";
import type { AuthSessionPayload } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

interface HeaderProps {
  session: AuthSessionPayload;
}

export default function Header({ session }: HeaderProps) {
  return (
    <header className="mx-4 my-4 flex flex-row items-center gap-4 border border-border bg-card px-4 py-4 place-content-between">
      <Link
        href="/"
        className="flex flex-row items-center gap-2 text-2xl font-medium transition-opacity hover:opacity-80"
      >
        <ChartLineIcon size={26} autoPlay />
        Finta
      </Link>

      <nav className="hidden items-center gap-2 md:flex">
        <Link
          href="/search"
          className="group inline-flex items-center gap-2 border border-transparent px-2 py-1 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted/50"
        >
          <SearchIcon size={14} />
          Buscar
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
          <Button type="submit" variant="ghost">
            <LogoutIcon size={18} />
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
