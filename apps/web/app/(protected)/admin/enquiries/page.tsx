import { Suspense } from "react";
import { EnquiryDirectoryClient } from "./components/EnquiryDirectoryClient";

// Suspense boundary is required: EnquiryDirectoryClient reads `useSearchParams()`
// via useListQueryState, which would otherwise de-opt this route from static
// rendering.
export default function EnquiryDirectoryPage() {
  return (
    <Suspense fallback={null}>
      <EnquiryDirectoryClient />
    </Suspense>
  );
}
