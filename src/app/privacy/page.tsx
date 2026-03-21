import type { Metadata } from "next";
import Link from "next/link";
import { legalEntityName, legalContactLine } from "@/lib/legal-config";

export const metadata: Metadata = {
    title: "Privacy Policy | Hotel AI",
    description: "Privacy Policy for Hotel AI — digital room service platform for hotels in India.",
};

export default function PrivacyPolicyPage() {
    const contact = legalContactLine();
    const entity = legalEntityName;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                        ← Back
                    </Link>
                    <span className="text-sm font-medium">Privacy Policy</span>
                </div>
            </header>

            <article className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
                <p className="text-xs text-muted-foreground mb-2">
                    Effective date: 15 March 2026 · For hotels and users located in India only
                </p>

                <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
                <p className="text-sm mb-4">
                    This Privacy Policy describes how <strong className="text-foreground">{entity}</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, and protects personal data when you use the Hotel AI platform (the &quot;Service&quot;) — including our website, admin dashboard, and guest-facing experiences (such as digital menus and room service ordering) offered to hotels in India.
                </p>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">1. Scope and who this applies to</h2>
                <p>
                    This Policy applies to (a) hotel staff and administrators who register for and use the Service on behalf of a hotel in India, and (b) processing activities we perform as a technology provider to those hotels. Guest-facing features may involve data about end guests (e.g. room identifiers, order details); such processing is typically carried out on behalf of the hotel, which acts as the data principal&apos;s first point of contact for many guest queries.
                </p>
                <p>
                    The Service is intended for use <strong>within India</strong> only. If you access the Service from outside India, different laws may apply; we currently target Indian hotels and Indian operations.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">2. Legal framework</h2>
                <p>
                    We aim to align our practices with applicable Indian law, including the <strong>Digital Personal Data Protection Act, 2023</strong> (&quot;DPDPA&quot;) and rules issued thereunder, as well as the <strong>Information Technology Act, 2000</strong> and applicable rules (including those relating to reasonable security practices and sensitive personal data or information, where relevant).
                </p>
                <p>
                    This Policy is for transparency and does not limit any rights you may have under law. Where the hotel is the primary decision-maker for certain guest data, the hotel&apos;s own privacy notices may also apply.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">3. Categories of personal data we may process</h2>
                <p>Depending on how you use the Service, we may process:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <strong>Hotel administrator / staff accounts:</strong> name, email address, role, hotel affiliation, and a cryptographically hashed password (we do not store your password in plain text).
                    </li>
                    <li>
                        <strong>Hotel profile:</strong> hotel name, address, phone, branding assets (e.g. logo URL), operating hours, and similar business information you choose to provide.
                    </li>
                    <li>
                        <strong>Operational data:</strong> menu items, categories, room numbers or identifiers, orders, order status, timestamps, optional guest notes or names associated with orders, and service requests submitted through the platform.
                    </li>
                    <li>
                        <strong>Technical and usage data:</strong> IP address, device/browser type, cookies or similar technologies where used, logs for security and reliability, and diagnostic information.
                    </li>
                </ul>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">4. Purposes of processing</h2>
                <p>We use personal data to:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Provide, operate, and improve the Service (account creation, authentication, dashboards, guest menu and ordering flows).</li>
                    <li>Communicate with you about the Service, security, or policy updates.</li>
                    <li>Ensure security, prevent fraud and abuse, and comply with legal obligations.</li>
                    <li>Analyse aggregated or de-identified usage to improve product quality (where we do not identify individuals).</li>
                </ul>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">5. Legal bases (India)</h2>
                <p>
                    Under the DPDPA, we rely on appropriate grounds as applicable — including <strong>your consent</strong> where required (for example, where you accept this Policy or cookie use where mandated), <strong>performance of a contract</strong> with you or your hotel, <strong>compliance with law</strong>, and <strong>legitimate uses</strong> permitted under the DPDPA (such as certain operational or security purposes), as interpreted in line with applicable regulations and guidance.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">6. Sharing and subprocessors</h2>
                <p>
                    We may share personal data with trusted service providers who assist us in hosting, databases, email delivery, file storage, analytics, or security — only to the extent needed to provide the Service and under appropriate contractual safeguards. We may also disclose information if required by law, court order, or government request in India, or to protect our rights and the safety of users.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">7. International transfers</h2>
                <p>
                    Our primary focus is India. If any processing or storage occurs outside India (for example, through a cloud provider), we will take steps consistent with applicable Indian law, including any requirements for transfers and safeguards.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">8. Retention</h2>
                <p>
                    We retain personal data only as long as necessary for the purposes above, including to meet legal, accounting, or reporting requirements, resolve disputes, and enforce agreements. Retention periods may vary by data type; some logs may be kept for shorter periods for security monitoring.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">9. Security</h2>
                <p>
                    We implement technical and organisational measures designed to protect personal data against unauthorised access, alteration, disclosure, or destruction. These include access controls, encryption in transit where appropriate for the Service, and secure handling of credentials. No method of transmission or storage is 100% secure; we encourage strong passwords and safeguarding of account access.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">10. Your rights and choices</h2>
                <p>
                    Subject to applicable law, you may have rights to access, correct, update, or request deletion of your personal data, withdraw consent where processing is consent-based (without affecting prior lawful processing), and nominate another person to exercise rights on your behalf in case of death or incapacity, as prescribed under the DPDPA.
                </p>
                <p>
                    To exercise these rights, or for questions about this Policy, contact us at: <strong className="text-foreground">{contact}</strong>
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">11. Grievance redressal</h2>
                <p>
                    If you have concerns about how we handle personal data, please contact us at the details above. We will acknowledge and address grievances in line with applicable timelines and requirements under Indian law. You may also have the right to approach the Data Protection Board of India or other remedies as provided by law.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">12. Children</h2>
                <p>
                    The Service is not directed at minors. Hotels should not use the Service to knowingly collect data from children in a manner that violates applicable law. If you believe we have inadvertently processed a child&apos;s data, contact us and we will take appropriate steps.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">13. Changes to this Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. We will post the revised version on this page and update the &quot;Effective date&quot; where material changes are made. Continued use of the Service after changes constitutes your acknowledgment of the updated Policy where permitted by law.
                </p>
                </section>

                <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground pt-2">14. Contact</h2>
                <p>
                    <strong className="text-foreground">{entity}</strong>
                    <br />
                    For privacy-related queries and grievances: <strong className="text-foreground">{contact}</strong>
                </p>
                </section>

                <p className="text-xs pt-4 border-t border-border">
                    <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                    </Link>
                </p>
            </article>
        </div>
    );
}
