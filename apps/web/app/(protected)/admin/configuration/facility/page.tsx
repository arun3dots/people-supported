import { Suspense } from "react";
import { FacilityContainer } from "./components/FacilityContainer";

export const metadata = {
  title: "Facility Configuration | Cantra Care",
};

export default function FacilityConfigurationPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground animate-pulse">
            Loading configuration...
          </div>
        }
      >
        <FacilityContainer />
      </Suspense>
    </div>
  );
}
