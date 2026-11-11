import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 font-sans">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-md font-bold uppercase tracking-wider text-emerald-800">
              CantraCare SaaS Subscription Agreement
            </p>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-md font-semibold text-emerald-800 border border-emerald-200">
              Version v1.0-2026-10 • Effective 29 October 2026
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-md text-slate-600">
            These Terms of Service govern the use of the CantraCare Care Home Management
            Platform by CQC-registered care providers (&ldquo;Customer&rdquo; or
            &ldquo;Tenant&rdquo;) and their authorised personnel.
          </p>
        </header>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            1. Scope of Service &amp; Clinical Responsibility
          </h2>
          <p>
            CantraCare provides cloud software for resident admission, care planning,
            electronic Medication Administration Records (eMAR), physiological
            observations (NEWS2), risk assessments, and workforce scheduling. Clinical
            decision-making tools (including NEWS2 scoring and escalation prompts) are
            decision-support aids aligned with Royal College of Physicians (RCP) and
            NHS DCB0129/DCB0160 clinical safety standards; they do not replace
            professional clinical judgement or emergency medical escalation (999/111).
          </p>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            2. Incorporation of the UK GDPR Article 28 Data Processing Agreement (A-02)
          </h2>
          <p>
            Where the Customer uses CantraCare to process personal data and
            special-category health data of residents, relatives, and staff, the
            Customer acts as the <strong>Data Controller</strong> and CantraCare acts as
            the <strong>Data Processor</strong>. Our{" "}
            <Link href="/dpa" className="font-semibold text-emerald-800 underline">
              UK GDPR Article 28 Data Processing Agreement (DPA)
            </Link>{" "}
            is incorporated by reference into these Terms of Service and becomes
            legally binding upon tenant onboarding and acceptance.
          </p>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            3. Access Control, Multi-Factor Authentication &amp; Tenant Isolation
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-md">
            <li>
              <strong>Mandatory MFA:</strong> Multi-Factor Authentication (TOTP) is
              mandatory for all `SuperAdmin`, `Admin`, and `Manager` accounts, and may be
              enforced across all `Nurse` and `Carer` accounts via Tenant Organisation
              Settings.
            </li>
            <li>
              <strong>Account Security:</strong> Customers must ensure each staff member
              uses an individual named account and immediately deactivate accounts upon
              termination of employment.
            </li>
            <li>
              <strong>CQC Inspection Access:</strong> Customers are responsible for
              verifying CQC Inspector identity before issuing read-only inspection exports
              or audit reports.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            4. Offboarding, Data Return &amp; Statutory Retention
          </h2>
          <p>
            Upon subscription termination, the Customer may export all resident care
            records, eMAR charts, and audit logs in structured JSON and PDF formats for
            30 days. Thereafter, CantraCare will delete or irreversibly anonymise
            Customer data except where statutory retention is mandated under UK law.
          </p>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            5. Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms of Service and the incorporated DPA are governed by and
            construed in accordance with the laws of England and Wales, and the parties
            submit to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <footer className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-md text-slate-500">
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="font-semibold text-emerald-800 hover:underline">
              Privacy Notice
            </Link>
            <Link href="/dpa" className="font-semibold text-emerald-800 hover:underline">
              UK GDPR Article 28 DPA
            </Link>
            <Link href="/login" className="hover:underline">
              Back to Sign In
            </Link>
          </div>
          <span>© 2026 CantraCare Ltd. All rights reserved.</span>
        </footer>
      </article>
    </main>
  );
}
