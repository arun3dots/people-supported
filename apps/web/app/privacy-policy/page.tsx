import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 font-sans">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-800">
              CantraCare UK GDPR & Data Protection Act 2018 Transparency Notice
            </p>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 border border-emerald-200">
              Version v1.0-2026-10 • Effective 29 October 2026
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Privacy Notice (UK GDPR Articles 13 &amp; 14)
          </h1>
          <p className="text-sm text-slate-600">
            This Privacy Notice explains how CantraCare (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
            &ldquo;our&rdquo;) processes personal data across our Care Home Management
            Platform in accordance with the UK General Data Protection Regulation
            (UK GDPR), the Data Protection Act 2018 (DPA 2018), and the Data (Use
            and Access) Act 2025 (DUAA).
          </p>
        </header>

        <section className="space-y-3 text-sm leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            1. Data Controller vs. Data Processor Roles (A-01 / A-04)
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Care Home Resident, Clinical, Next-of-Kin &amp; Staff Care Data (CantraCare as Data Processor):</strong>{" "}
              Each CQC-registered Care Home organisation (&ldquo;Tenant&rdquo;) is the{" "}
              <strong>Data Controller</strong> for the personal data and special-category
              health data of its residents, relatives/Powers of Attorney, and care staff.
              CantraCare processes this data strictly on the Care Home&apos;s documented
              instructions under our{" "}
              <Link href="/dpa" className="font-semibold text-emerald-800 underline">
                UK GDPR Article 28 Data Processing Agreement (DPA)
              </Link>
              .
            </li>
            <li>
              <strong>Platform Account, Billing &amp; Security Telemetry Data (CantraCare as Data Controller):</strong>{" "}
              CantraCare acts as an independent <strong>Data Controller</strong> for
              tenant onboarding contacts, commercial billing records, platform security
              audit logs, and support communications.
            </li>
          </ul>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm space-y-1">
            <p className="font-bold text-slate-900">
              Data Protection Officer (DPO) &amp; Privacy Contact:
            </p>
            <p>
              Email:{" "}
              <a
                href="mailto:dpo@cantracare.co.uk"
                className="font-semibold text-emerald-800 underline"
              >
                dpo@cantracare.co.uk
              </a>{" "}
              | Security &amp; Breach Reporting:{" "}
              <a
                href="mailto:security@cantracare.co.uk"
                className="font-semibold text-emerald-800 underline"
              >
                security@cantracare.co.uk
              </a>
            </p>
          </div>
        </section>

        <section className="space-y-3 text-sm leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            2. Categories of Personal Data We Process
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Resident Identity &amp; Admission Data:</strong> Full name, date of
              birth, NHS number (encrypted at rest using AES-256-GCM), room/bed
              allocation, emergency contacts, Lasting Power of Attorney (LPA) and Court
              of Protection records, and funding details.
            </li>
            <li>
              <strong>Special Category Health &amp; Care Records (UK GDPR Art 9):</strong>{" "}
              Diagnoses, allergies, DNACPR/ReSPECT status, NEWS2 physiological
              observations, Medication Administration Records (eMAR), clinical body
              maps, care plans, risk assessments, daily care notes, and CQC statutory
              incident notifications.
            </li>
            <li>
              <strong>Workforce &amp; HR Compliance Data:</strong> Staff name, role, NI
              number (encrypted), DBS certificate number and check status (encrypted),
              right-to-work verification, training/qualification matrices, shift rotas,
              and clinical handover notes.
            </li>
            <li>
              <strong>Security &amp; Audit Telemetry:</strong> IP address, user agent,
              authentication timestamps, MFA verification status, and tamper-evident
              HMAC-SHA256 audit log entries. Optional geolocation on page views is{" "}
              <strong>disabled by default</strong> and only captured where a Care Home
              Controller explicitly enables location-verified clinical access.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            3. Lawful Bases for Processing (UK GDPR Articles 6 &amp; 9)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-800 font-bold">
                <tr>
                  <th className="p-3">Processing Purpose</th>
                  <th className="p-3">Article 6 Lawful Basis</th>
                  <th className="p-3">Article 9 Condition &amp; DPA 2018 Schedule 1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium">
                    Resident care planning, eMAR, NEWS2 observations &amp; safeguarding
                  </td>
                  <td className="p-3">
                    Art 6(1)(c) Legal obligation (Health and Social Care Act 2008
                    Regulated Activities Regulations 2014 Reg 9, 12, 17) &amp; Art 6(1)(e)
                    Public task / social care provision
                  </td>
                  <td className="p-3">
                    Art 9(2)(h) Health or social care provision + DPA 2018 Sch 1 Part 1
                    para 2 (Confidentiality obligation)
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">
                    Staff onboarding, DBS checks, right-to-work &amp; rota management
                  </td>
                  <td className="p-3">
                    Art 6(1)(b) Employment contract &amp; Art 6(1)(c) Legal obligation
                    (CQC Reg 18 &amp; Reg 19 Fit and proper persons employed)
                  </td>
                  <td className="p-3">
                    Art 9(2)(b) Employment, social security and social protection law +
                    DPA 2018 Sch 1 Part 1 para 1
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">
                    Platform security, MFA, tamper-evident audit logging &amp; billing
                  </td>
                  <td className="p-3">
                    Art 6(1)(b) Contract performance &amp; Art 6(1)(f) Legitimate
                    interests (ensuring DSPT / NHS clinical system integrity)
                  </td>
                  <td className="p-3">
                    Art 9(2)(f) Establishment, exercise or defence of legal claims / Art
                    9(2)(h)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3 text-sm leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            4. Sub-Processors &amp; International Data Transfers (H-02)
          </h2>
          <p>
            CantraCare hosts primary databases and clinical object storage in the{" "}
            <strong>United Kingdom (Google Cloud `europe-west2` London)</strong>. We use
            the following vetted sub-processors:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>
              <strong>Google Cloud Platform (UK - `europe-west2` London):</strong>{" "}
              Encrypted database hosting and Google Cloud Storage for resident clinical
              documents and profile photos.
            </li>
            <li>
              <strong>Amazon Web Services (AWS SNS - `eu-west-2` London):</strong> SMS
              delivery for clinical alerts and authentication codes.
            </li>
            <li>
              <strong>Resend Inc.:</strong> Transactional email delivery (MFA recovery
              OTPs, staff invitations, billing notifications) governed by UK Addendum to
              EU SCCs.
            </li>
            <li>
              <strong>Google Firebase Cloud Messaging (FCM):</strong> Push notifications
              to authorised clinical mobile devices (resident names are pseudonymised to
              initials + short identifier in push payloads).
            </li>
            <li>
              <strong>Razorpay Software Pvt. Ltd.:</strong> SaaS subscription billing for
              Care Home tenants (no resident health data is ever shared with Razorpay).
            </li>
          </ul>
          <p className="text-sm text-slate-600">
            Where authorised engineering support or sub-processors operate outside the UK,
            transfers are safeguarded by the{" "}
            <strong>UK International Data Transfer Agreement (IDTA)</strong> and a
            documented <strong>Transfer Risk Assessment (TRA)</strong> in accordance with
            UK GDPR Article 46 and s.85 of the Data (Use and Access) Act 2025.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            5. Data Retention Schedule (NHS Records Management Code of Practice)
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>
              <strong>Adult Social Care Resident Records:</strong> Retained for{" "}
              <strong>8 years</strong> following discharge or death in accordance with
              the NHS England <em>Records Management Code of Practice for Health and Adult
              Social Care</em>, then securely purged or anonymised unless subject to an
              active legal/safeguarding hold.
            </li>
            <li>
              <strong>Staff HR &amp; DBS Compliance Summary Records:</strong> Retained for{" "}
              <strong>6 years</strong> after termination of employment (DBS certificate
              numbers are stored encrypted for CQC inspection evidence).
            </li>
            <li>
              <strong>Clinical &amp; Security Audit Logs:</strong> Retained in
              tamper-evident HMAC-SHA256 chains for <strong>8 years</strong> to satisfy
              CQC Regulation 17 and DSPT forensic audit requirements.
            </li>
            <li>
              <strong>Authentication Tokens &amp; OTPs:</strong> Access tokens expire
              after 15 minutes; refresh tokens after 7 days; password/MFA reset OTPs
              expire after 10 minutes.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            6. Your Data Protection Rights &amp; DUAA s.103 Complaints Procedure
          </h2>
          <p>
            Under UK GDPR Articles 15–22, individuals have the right of{" "}
            <strong>Access (Subject Access Request / SAR)</strong>,{" "}
            <strong>Rectification</strong>, <strong>Erasure</strong> (subject to statutory
            CQC clinical retention exemptions under Art 17(3)(b)/(c)),{" "}
            <strong>Restriction of Processing</strong>, <strong>Data Portability</strong>,
            and <strong>Objection</strong>.
          </p>
          <p className="text-sm">
            <strong>How to exercise your rights:</strong> Care Home residents, relatives,
            and care staff should submit requests directly to their Care Home Manager
            (who can generate a complete machine-readable JSON or printable PDF SAR
            dossier directly within CantraCare). You may also contact our DPO at{" "}
            <a
              href="mailto:dpo@cantracare.co.uk"
              className="font-semibold text-emerald-800 underline"
            >
              dpo@cantracare.co.uk
            </a>
            .
          </p>
          <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 text-sm space-y-1.5">
            <p className="font-bold text-slate-900">
              Data Protection Complaints Procedure (Data (Use and Access) Act 2025 s.103) &amp;
              ICO Escalation:
            </p>
            <p>
              If you are dissatisfied with how your personal data is handled, you may
              lodge a formal complaint with our DPO at{" "}
              <a
                href="mailto:dpo@cantracare.co.uk"
                className="font-semibold text-emerald-800 underline"
              >
                dpo@cantracare.co.uk
              </a>
              . We will acknowledge your complaint within <strong>7 calendar days</strong>{" "}
              and provide a substantive response within <strong>28 calendar days</strong>.
            </p>
            <p>
              You also have the statutory right to complain at any time to the UK
              supervisory authority: <strong>Information Commissioner&apos;s Office (ICO)</strong>,
              Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF (Tel: 0303 123 1113
              | Website:{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold"
              >
                https://ico.org.uk
              </a>
              ).
            </p>
          </div>
        </section>

        <footer className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <Link href="/terms" className="font-semibold text-emerald-800 hover:underline">
              Terms of Service
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
