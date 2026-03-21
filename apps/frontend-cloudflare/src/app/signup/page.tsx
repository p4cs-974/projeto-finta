import { ChartLineIcon } from "@/components/ui/chart-line";

import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background gap-6 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="#"
          className="flex items-baseline gap-2 self-center font-medium text-5xl"
        >
          <ChartLineIcon size={40} />
          <span className="font-[family-name:var(--font-geist-pixel-triangle)]">
            Finta
          </span>
        </a>
        <SignupForm className="border-border border" />
      </div>
    </div>
  );
}
