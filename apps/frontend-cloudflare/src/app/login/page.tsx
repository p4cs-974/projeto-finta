import { ChartLineIcon } from "@/components/ui/chart-line";

import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

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
        <LoginForm
          className="border border-border bg-card px-4 py-6"
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}
