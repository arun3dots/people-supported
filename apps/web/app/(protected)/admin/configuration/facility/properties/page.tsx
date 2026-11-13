import { Suspense } from "react";
import { PropertiesTab } from "../components/tabs/PropertiesTab";

export const metadata = {
  title: "Properties Directory | Cantra Care",
};

export default function PropertiesDirectoryPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground animate-pulse">
            Loading properties...
          </div>
        }
      >
        <PropertiesTab />
      </Suspense>
    </div>
  );
}
