import { Button } from "@repo/ui/components/ui";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 font-sans">
      <main className="flex flex-col gap-8 items-center max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Documentation
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Centralized documentation powered by Next.js and customized Shadcn UI
          components.
        </p>

        <div className="flex gap-4 items-center">
          <Button variant="secondary" size="lg">
            Read Docs
          </Button>
        </div>
      </main>
    </div>
  );
}
