import { DashboardContent } from "@/components/dashboard";
import { getDashboardServer } from "@/lib/backend-server";
import { ApiRequestError } from "@/lib/http-client";

function DashboardErrorState({ message }: { message: string }) {
  return (
    <main className="flex flex-1 flex-col px-4 pb-4 md:px-6">
      <div className="mx-auto w-full max-w-7xl py-6">
        <section className="border border-dashed border-rose-500/40 bg-rose-500/8 p-6 text-sm text-rose-700 dark:text-rose-300">
          {message}
        </section>
      </div>
    </main>
  );
}

export default async function DashboardPage() {
  try {
    const dashboard = await getDashboardServer();

    return <DashboardContent dashboard={dashboard} />;
  } catch (error) {
    const message =
      error instanceof ApiRequestError && error.status === 401
        ? "Sua sessão expirou. Faça login novamente para carregar o dashboard."
        : "Não foi possível carregar o dashboard no momento.";

    return <DashboardErrorState message={message} />;
  }
}
