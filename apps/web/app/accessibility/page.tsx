import Link from "next/link";

export default function AccessibilityStatementPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 font-sans">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-800">
              CantraCare Accessibility &amp; Digital Inclusion Statement
            </p>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 border border-emerald-200">
              Version v1.0-2026-10 • Standard WCAG 2.2 Level AA
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Accessibility Statement
          </h1>
          <p className="text-md text-slate-600">
            CantraCare is committed to making our Care Home Management Platform
            accessible to all users, including care workers, registered nurses,
            care home managers, residents, and visitors with disabilities, in
            accordance with the Web Content Accessibility Guidelines (WCAG) 2.2
            at Level AA.
          </p>
        </header>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            1. Our Commitment and Approach (I-04)
          </h2>
          <p>
            We design and build our platform to ensure that everyone can:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Navigate the user interface using only a keyboard or speech-recognition software.</li>
            <li>Listen to the service using modern screen readers (including JAWS, NVDA, VoiceOver, and TalkBack).</li>
            <li>Zoom in up to 300% without text overflowing or horizontal scrolling obstacles.</li>
            <li>Distinguish critical clinical indicators, NEWS2 physiological scores, and RAG risk alerts without relying solely on color.</li>
            <li>Experience compliant contrast ratios of at least 4.5:1 for standard text and 3:1 for graphical interface components.</li>
          </ul>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            2. Clinical Indicators, NEWS2 &amp; Non-Color Encoding
          </h2>
          <p>
            In clinical care environments, information density is high and rapid
            decision-making is essential. To comply with WCAG 2.2 Success
            Criterion 1.4.1 (Use of Color):
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>NEWS2 Vitals Scoring:</strong> Every physiological alert
              displays both the numeric aggregate score and an accessible text
              badge (e.g., &ldquo;Low Clinical Risk (Score 1-4)&rdquo;, &ldquo;Medium
              Clinical Risk (Score 5-6)&rdquo;, &ldquo;High Clinical Risk (Score 7+)&rdquo;).
            </li>
            <li>
              <strong>Single Extreme Parameter Alerts:</strong> Extreme score-3
              triggers are denoted with explicit icon markers and screen-reader
              announcements (&ldquo;Red Parameter Alert: Respiration ≤ 8 bpm&rdquo;).
            </li>
            <li>
              <strong>MAR Administration Status:</strong> Dose states (Given,
              Refused, Omitted, NPO) utilize distinct SVG iconography alongside
              visible text labels, preventing ambiguity for color-blind practitioners.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            3. Technical Specifications
          </h2>
          <p>
            Accessibility of the CantraCare platform relies on the following
            technologies to work with your web browser and assistive technologies:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>HTML5 and semantic landmark regions (&lt;main&gt;, &lt;nav&gt;, &lt;aside&gt;, &lt;article&gt;)</li>
            <li>WAI-ARIA 1.2 roles, attributes, and live regions</li>
            <li>Tailwind CSS compliant with WCAG 2.2 color contrast ratios</li>
            <li>Accessible Radix UI headless components with keyboard focus traps</li>
          </ul>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            4. Feedback and Reporting Accessibility Issues
          </h2>
          <p>
            We welcome your feedback on the accessibility of CantraCare. If you
            encounter accessibility barriers or require information in an
            alternative format (such as accessible PDF, large print, or audio):
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:accessibility@cantracare.co.uk" className="font-semibold text-emerald-800 underline">
                accessibility@cantracare.co.uk
              </a>
            </li>
            <li>
              <strong>Phone:</strong> +44 (0) 20 7946 0912 (Monday to Friday, 09:00 to 17:00 GMT)
            </li>
            <li>
              <strong>Postal Address:</strong> CantraCare Health Technologies Ltd, 100 Bishopsgate, London, EC2N 4AG, United Kingdom
            </li>
          </ul>
          <p>
            We aim to acknowledge all accessibility feedback within 2 business
            days and provide a substantive resolution or workaround plan within 10
            business days.
          </p>
        </section>

        <section className="space-y-3 text-md leading-6 text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">
            5. Enforcement Procedure
          </h2>
          <p>
            The Equality and Human Rights Commission (EHRC) is responsible for
            enforcing accessibility regulations in the UK. If you are not
            satisfied with how we respond to your complaint, you can contact the{" "}
            <a
              href="https://www.equalityadvisoryservice.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-800 underline"
            >
              Equality Advisory and Support Service (EASS)
            </a>
            .
          </p>
        </section>

        <footer className="border-t border-slate-200 pt-6 text-sm text-slate-500 flex justify-between items-center flex-wrap gap-2">
          <span>CantraCare Health Technologies Ltd • Registered in England &amp; Wales</span>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="/dpa" className="hover:underline">
              Article 28 DPA
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}

