"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { AUTH_NAV_ITEMS, type AuthNavigationIcon } from "./auth-navigation";
import LayoutDashboardIcon from "./ui/layout-dashboard-icon";
import { LogoutIcon } from "./ui/logout";
import { SearchIcon } from "./ui/search";
import StarIcon from "./ui/star-icon";
import { Button } from "./ui/button";
import type { AuthSessionPayload } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  session: AuthSessionPayload;
  defaultOpen?: boolean;
  initialConfirmingLogout?: boolean;
}

const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

function NavIcon({
  icon,
  className,
}: {
  icon: AuthNavigationIcon;
  className?: string;
}) {
  switch (icon) {
    case "dashboard":
      return <LayoutDashboardIcon className={className} size={16} />;
    case "search":
      return <SearchIcon className={className} size={16} />;
    case "favorites":
      return <StarIcon className={className} size={16} />;
  }
}

export default function MobileNav({
  session,
  defaultOpen = false,
  initialConfirmingLogout = false,
}: MobileNavProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [confirmingLogout, setConfirmingLogout] = useState(
    initialConfirmingLogout,
  );
  const navId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  function closeNav() {
    setOpen(false);
    setConfirmingLogout(false);
  }

  function toggleNav() {
    setOpen((current) => {
      if (current) {
        setConfirmingLogout(false);
      }

      return !current;
    });
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeNav();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeNav();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const actionTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.26, ease: EASE_OUT_QUART };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 md:hidden"
      style={{
        bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 1rem))",
      }}
    >
      <AnimatePresence>
        {open ? (
          <motion.button
            key="mobile-nav-backdrop"
            type="button"
            aria-label="Fechar navegação rápida"
            className="pointer-events-auto fixed inset-0 bg-foreground/8 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.18,
              ease: EASE_OUT_QUART,
            }}
            onClick={closeNav}
          />
        ) : null}
      </AnimatePresence>

      <div
        ref={containerRef}
        className="pointer-events-none flex justify-end px-4"
        style={{
          paddingRight: "max(1rem, calc(env(safe-area-inset-right) + 1rem))",
        }}
      >
        <div className="pointer-events-auto relative z-10 isolate flex flex-col items-end gap-3">
          <AnimatePresence>
            {open ? (
              <motion.div
                key="mobile-nav-actions"
                id={navId}
                role="menu"
                aria-label={`Navegação rápida para ${session.name}`}
                className="flex flex-col items-end gap-2"
                initial="closed"
                animate="open"
                exit="closed"
              >
                {AUTH_NAV_ITEMS.map((item, index) => (
                  <motion.div
                    key={item.href}
                    custom={index}
                    variants={{
                      open: (i: number) => ({
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          ...actionTransition,
                          delay: shouldReduceMotion ? 0 : i * 0.045,
                        },
                      }),
                      closed: {
                        opacity: 0,
                        y: shouldReduceMotion ? 0 : 10,
                        scale: shouldReduceMotion ? 1 : 0.96,
                        transition: {
                          duration: shouldReduceMotion ? 0.01 : 0.16,
                          ease: EASE_OUT_EXPO,
                        },
                      },
                    }}
                  >
                    <Button
                      asChild
                      variant="outline"
                      className={cn(
                        "h-10 rounded-none border-border !bg-card px-4 text-sm",
                      )}
                    >
                      <Link
                        href={item.href}
                        role="menuitem"
                        className="gap-2.5"
                        onClick={closeNav}
                      >
                        <NavIcon icon={item.icon} />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  </motion.div>
                ))}

                <motion.div
                  custom={AUTH_NAV_ITEMS.length}
                  variants={{
                    open: (i: number) => ({
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        ...actionTransition,
                        delay: shouldReduceMotion ? 0 : i * 0.045,
                      },
                    }),
                    closed: {
                      opacity: 0,
                      y: shouldReduceMotion ? 0 : 10,
                      scale: shouldReduceMotion ? 1 : 0.96,
                      transition: {
                        duration: shouldReduceMotion ? 0.01 : 0.16,
                        ease: EASE_OUT_EXPO,
                      },
                    },
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {confirmingLogout ? (
                      <motion.div
                        key="logout-confirm"
                        className="flex items-center gap-2"
                        initial={{
                          opacity: 0,
                          y: shouldReduceMotion ? 0 : 8,
                          scale: shouldReduceMotion ? 1 : 0.98,
                        }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          y: shouldReduceMotion ? 0 : 8,
                          scale: shouldReduceMotion ? 1 : 0.98,
                        }}
                        transition={actionTransition}
                      >
                        <form action={logoutAction} onSubmit={closeNav}>
                          <Button
                            type="submit"
                            variant="destructive"
                            role="menuitem"
                            className="h-10 rounded-none border border-destructive/20 !bg-card px-4 text-sm"
                          >
                            Confirmar
                          </Button>
                        </form>
                        <Button
                          type="button"
                          variant="outline"
                          role="menuitem"
                          className="h-10 rounded-none border-border !bg-card px-4 text-sm"
                          onClick={() => setConfirmingLogout(false)}
                        >
                          Cancelar
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="logout-action"
                        initial={{
                          opacity: 0,
                          y: shouldReduceMotion ? 0 : 8,
                          scale: shouldReduceMotion ? 1 : 0.98,
                        }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          y: shouldReduceMotion ? 0 : 8,
                          scale: shouldReduceMotion ? 1 : 0.98,
                        }}
                        transition={actionTransition}
                      >
                        <Button
                          type="button"
                          variant="destructive"
                          role="menuitem"
                          className="h-10 rounded-none border border-destructive/20 !bg-card px-4 text-sm"
                          onClick={() => setConfirmingLogout(true)}
                        >
                          <LogoutIcon size={16} />
                          <span>Sair</span>
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div
            animate={open ? "open" : "closed"}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.24,
              ease: EASE_OUT_QUART,
            }}
          >
            <Button
              type="button"
              size="icon-lg"
              variant="default"
              aria-controls={navId}
              aria-expanded={open}
              aria-label={
                open ? "Fechar navegação rápida" : "Abrir navegação rápida"
              }
              className={cn(
                "size-14 rounded-none border-primary/30 !bg-primary text-primary-foreground",
                "transition-transform duration-200 ease-out will-change-transform hover:!bg-primary/90 active:scale-[0.96]",
              )}
              onClick={toggleNav}
            >
              <motion.div
                variants={{
                  closed: { rotate: 0, scale: 1 },
                  open: { rotate: 45, scale: 1.04 },
                }}
                transition={{
                  duration: shouldReduceMotion ? 0.01 : 0.22,
                  ease: EASE_OUT_EXPO,
                }}
              >
                <Plus size={20} strokeWidth={2.4} />
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
