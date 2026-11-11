"use client";

import Link from "next/link";

interface PolicyLinksProps {
  className?: string;
}

export function PolicyLinks({ className }: PolicyLinksProps) {
  return (
    <>
      I agree to the{" "}
      <Link
        href="/terms"
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={className}
      >
        Terms of Service
      </Link>
      ,{" "}
      <Link
        href="/dpa"
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={className}
      >
        UK GDPR Article 28 Data Processing Agreement (DPA)
      </Link>
      , and{" "}
      <Link
        href="/privacy-policy"
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={className}
      >
        Privacy Notice
      </Link>
    </>
  );
}
