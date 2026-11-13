import { Suspense } from "react";
import { SchemesTab } from "../components/tabs/SchemesTab";

export const metadata = {
  title: "Supported Living Schemes | Cantra Care",
};

export default function SchemesPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground animate-pulse">
            Loading schemes...
          </div>
        }
      >
        <SchemesTab />
      </Suspense>
    </div>
  );
}
