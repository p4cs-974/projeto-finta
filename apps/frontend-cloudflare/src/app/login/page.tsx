import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background gap-6 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 bg-card">
        <LoginForm
          className="border border-border px-4 py-6"
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}
