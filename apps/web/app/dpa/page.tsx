import Link from "next/link";

export default function DpaPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 font-sans">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-md font-bold uppercase tracking-wider text-emerald-800">
              UK GDPR Article 28 Contract &amp; Care Home Privacy Pack (A-02 / A-04)
            </p>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-md font-semibold text-emerald-800 border border-emerald-200">
              Version v1.0-2026-10 • Effective 29 October 2026
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Data Processing Agreement (UK GDPR Article 28)
          </h1>
          <p className="text-md text-slate-600">
            This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of the Terms of
            Service between the CQC-registered Care Home Provider (&ldquo;Controller&rdquo;)
            and CantraCare Ltd (&ldquo;Processor&rdquo;) in compliance with Article 28(3)
            of the UK General Data Protection Regulation (UK GDPR) and the Data Protection
            Act 2018.
          </p>
        </header>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            1. Subject Matter, Duration, Nature &amp; Purpose of Processing
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-md">
            <li>
              <strong>Subject Matter:</strong> Provision of the CantraCare cloud care
              management platform for adult social care and nursing homes.
            </li>
            <li>
              <strong>Duration:</strong> For the term of the Controller&apos;s active SaaS
              subscription plus a 30-day offboarding export window.
            </li>
            <li>
              <strong>Data Subjects:</strong> Care home residents, relatives/Lasting
              Powers of Attorney (LPAs)/visitors, and care home employees/agency staff.
            </li>
            <li>
              <strong>Categories of Data:</strong> Identity, contact details, NHS number,
              date of birth, special-category health and clinical care data (care plans,
              eMAR, NEWS2 observations, risk assessments, body maps, CQC incident reports),
              and staff HR/DBS compliance data.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            2. Mandatory UK GDPR Article 28(3)(a)–(h) Processor Obligations
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-md">
            <li>
              <strong>Documented Instructions — Art 28(3)(a):</strong> CantraCare shall
              process Personal Data only on documented instructions from the Controller,
              including with regard to international transfers, unless required to do so
              by UK law.
            </li>
            <li>
              <strong>Confidentiality — Art 28(3)(b):</strong> CantraCare ensures that all
              personnel authorised to process Personal Data have committed themselves to
              statutory and contractual confidentiality obligations and completed annual
              NHS Data Security and Protection Toolkit (DSPT) training.
            </li>
            <li>
              <strong>Security of Processing (TOMs) — Art 28(3)(c) &amp; Art 32:</strong>{" "}
              CantraCare implements Technical and Organisational Measures including:
              AES-256-GCM field-level encryption at rest (`nhsNumber`, `dob`, `niNumber`,
              `dbsNumber`, `certificateNumber`, `mfaSecret`, `phoneNumber`,
              `addressLine1`); TLS 1.2+ in transit with HSTS; strict JWT `tenantId`
              isolation; mandatory TOTP MFA for privileged roles; and tamper-evident
              HMAC-SHA256 chained audit logs with automated nightly verification.
            </li>
            <li>
              <strong>Sub-Processor Controls — Art 28(3)(d):</strong> The Controller
              grants general written authorisation for the sub-processors listed in Schedule
              1 below. CantraCare shall notify the Controller at least{" "}
              <strong>30 days in advance</strong> of any intended addition or replacement
              of a sub-processor, giving the Controller the opportunity to object on data
              protection grounds, and imposes equivalent Article 28(3) obligations on
              every sub-processor.
            </li>
            <li>
              <strong>Assistance with Data Subject Rights — Art 28(3)(e):</strong>{" "}
              CantraCare provides built-in self-service Subject Access Request (SAR) JSON
              and PDF dossier export tools (`/api/data-rights/residents/:id/export` and
              `/api/data-rights/staff/:id/export`) and rectification workflows to enable
              the Controller to respond to UK GDPR Chapter III requests within statutory
              timeframes.
            </li>
            <li>
              <strong>Breach Notification &amp; DPIA Assistance — Art 28(3)(f):</strong>{" "}
              CantraCare shall notify the Controller without undue delay (and in any event
              within <strong>24 hours</strong> of confirmation) after becoming aware of a
              Personal Data Breach, and assists the Controller with UK GDPR Articles 32–36
              obligations (security, ICO 72-hour breach reporting, CQC notifications, and
              Data Protection Impact Assessments).
            </li>
            <li>
              <strong>Return or Deletion on Termination — Art 28(3)(g):</strong> At the
              choice of the Controller upon termination of services, CantraCare shall
              provide a complete export of all Controller data and subsequently delete or
              irreversibly anonymise all copies unless UK law requires storage.
            </li>
            <li>
              <strong>Audit &amp; Inspection Rights — Art 28(3)(h):</strong> CantraCare
              shall make available to the Controller all information necessary to
              demonstrate compliance with Article 28 (including DSPT assertions,
              penetration test summaries, and audit chain integrity reports) and allow for
              and contribute to audits conducted by the Controller or a mandated auditor.
            </li>
          </ol>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            Schedule 1: Authorised Sub-Processors
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-md">
              <thead className="bg-slate-100 text-slate-800 font-bold">
                <tr>
                  <th className="p-3">Sub-Processor</th>
                  <th className="p-3">Service Provided</th>
                  <th className="p-3">Processing Location &amp; Safeguard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium">Google Cloud Platform (GCP)</td>
                  <td className="p-3">Cloud database &amp; AWS S3 encrypted document storage</td>
                  <td className="p-3">UK (`europe-west2` London) • UK Adequacy / UK DPA</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Amazon Web Services (AWS SNS)</td>
                  <td className="p-3">Transactional SMS alerts</td>
                  <td className="p-3">UK (`eu-west-2` London) • UK DPA</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Resend Inc.</td>
                  <td className="p-3">Transactional email delivery</td>
                  <td className="p-3">US / EU • UK International Data Transfer Addendum</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Google Firebase (FCM)</td>
                  <td className="p-3">Pseudonymised mobile push notifications</td>
                  <td className="p-3">Global • UK Addendum + Pseudonymisation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            Schedule 2: Model Care Home Resident &amp; Staff Privacy Notice Template (A-04)
          </h2>
          <p className="text-md text-slate-600">
            Care Home Controllers may adapt the template below for their Resident
            Admission Packs and Staff Handbooks to satisfy UK GDPR Articles 13 &amp; 14:
          </p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-md font-mono space-y-2 text-slate-800">
            <p className="font-bold">
              [CARE HOME NAME] — PRIVACY NOTICE FOR RESIDENTS, RELATIVES &amp; STAFF
            </p>
            <p>
              1. Data Controller: [Care Home Legal Name] (CQC Provider ID: [1-XXXXXXX]) is
              the Data Controller responsible for your personal and health information.
            </p>
            <p>
              2. Digital Care System Processor: We use CantraCare Ltd as our secure UK
              GDPR Article 28 Data Processor to record care plans, medications (eMAR),
              vital signs (NEWS2), and staff rotas. Data is encrypted at rest in the UK
              (London `europe-west2`).
            </p>
            <p>
              3. Lawful Basis: We process resident care records under UK GDPR Art 6(1)(c)
              (CQC Regulated Activities Regulations 2014) and Art 9(2)(h) (Provision of
              Health &amp; Social Care).
            </p>
            <p>
              4. Retention &amp; Rights: Adult care records are retained for 8 years after
              care ends. To request a copy of your records (Subject Access Request) or
              raise a data protection complaint under s.103 of the Data (Use and Access)
              Act 2025, contact our Registered Manager at [Insert Care Home Email] or the
              ICO (https://ico.org.uk).
            </p>
          </div>
        </section>

        <footer className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-md text-slate-500">
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="font-semibold text-emerald-800 hover:underline">
              Privacy Notice
            </Link>
            <Link href="/terms" className="font-semibold text-emerald-800 hover:underline">
              Terms of Service
            </Link>
            <Link href="/signup" className="hover:underline">
              Back to Registration
            </Link>
          </div>
          <span>© 2026 CantraCare Ltd. All rights reserved.</span>
        </footer>
      </article>
    </main>
  );
}

