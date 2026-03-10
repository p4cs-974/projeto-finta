import type { Viewport } from "next";

import { GalleryVerticalEnd } from "lucide-react";

import { SignupForm } from "@/components/signup-form";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#313131" },
  ],
};

export default function SignupPage() {
  return (
    <div
      data-page-shell="muted"
      className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-10"
    >
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Finta
        </a>
        <SignupForm />
      </div>
    </div>
  );
}
