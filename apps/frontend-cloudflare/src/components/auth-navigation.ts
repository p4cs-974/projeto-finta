export type AuthNavigationIcon = "dashboard" | "search" | "favorites";

export interface AuthNavigationItem {
  href: string;
  label: string;
  icon: AuthNavigationIcon;
}

export const AUTH_NAV_ITEMS: AuthNavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    href: "/search",
    label: "Buscar",
    icon: "search",
  },
  {
    href: "/favoritos",
    label: "Favoritos",
    icon: "favorites",
  },
];
