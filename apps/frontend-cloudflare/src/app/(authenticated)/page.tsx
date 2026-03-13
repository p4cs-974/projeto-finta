import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 pb-4 md:px-6">
      <section className="w-full max-w-5xl border border-border bg-card p-8 md:p-12">
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Nada pra ver aqui ainda.
        </h1>
        <Image
          src="https://media.tenor.com/ckvwQ2JeozsAAAAj/yellow-spinning-banana.gif"
          alt="Banana giratoria"
          className="mt-6 h-auto w-full max-w-[200px]"
          width={200}
          height={200}
        />
      </section>
    </main>
  );
}
