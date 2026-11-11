import { Suspense } from "react";
import { StaffDirectory } from "./StaffDirectory";

export default function StaffPage() {
  return (
    <Suspense fallback={null}>
      <StaffDirectory />
    </Suspense>
  );
}
