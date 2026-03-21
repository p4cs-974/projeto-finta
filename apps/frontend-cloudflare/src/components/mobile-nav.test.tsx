import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("motion/react", async () => {
  const React = await import("react");

  const createMotionComponent = (tag: string) => {
    const Component = React.forwardRef(
      (
        {
          children,
          ...props
        }: React.HTMLAttributes<HTMLElement> & {
          children?: React.ReactNode;
        },
        ref,
      ) => React.createElement(tag, { ...props, ref }, children),
    );

    Component.displayName = `MockMotion(${tag})`;

    return Component;
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: (_, tag: string) => createMotionComponent(tag),
      },
    ),
    useAnimation: () => ({
      start: vi.fn(),
    }),
    useReducedMotion: () => false,
    useAnimate: () => [null, vi.fn()],
  };
});

vi.mock("@/app/actions/auth", () => ({
  logoutAction: "/logout",
}));

import { AUTH_NAV_ITEMS } from "./auth-navigation";
import MobileNav from "./mobile-nav";

describe("AUTH_NAV_ITEMS", () => {
  it("defines the authenticated links rendered by the header and mobile nav", () => {
    expect(AUTH_NAV_ITEMS).toEqual([
      { href: "/", label: "Dashboard", icon: "dashboard" },
      { href: "/search", label: "Buscar", icon: "search" },
      { href: "/favoritos", label: "Favoritos", icon: "favorites" },
    ]);
  });
});

describe("MobileNav", () => {
  const session = {
    name: "Maria Silva",
    email: "maria@example.com",
    iat: 0,
    exp: 1,
    sub: "user-1",
  };

  it("renders a collapsed trigger with accessibility attributes", () => {
    const html = renderToStaticMarkup(<MobileNav session={session} />);

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Abrir navegação rápida"');
    expect(html).not.toContain(">Dashboard<");
    expect(html).not.toContain(">Sair<");
  });

  it("renders the expanded navigation links and logout action when opened", () => {
    const html = renderToStaticMarkup(
      <MobileNav session={session} defaultOpen />,
    );

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="menu"');
    expect(html).toContain('aria-label="Fechar navegação rápida"');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/search"');
    expect(html).toContain('href="/favoritos"');
    expect(html).toContain(">Dashboard<");
    expect(html).toContain(">Buscar<");
    expect(html).toContain(">Favoritos<");
    expect(html).toContain(">Sair<");
  });

  it("renders confirm and cancel actions when logout confirmation is active", () => {
    const html = renderToStaticMarkup(
      <MobileNav
        session={session}
        defaultOpen
        initialConfirmingLogout
      />,
    );

    expect(html).toContain(">Confirmar<");
    expect(html).toContain(">Cancelar<");
    expect(html).not.toContain(">Sair<");
  });
});
