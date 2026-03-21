import type { Metadata } from "next";
import Link from "next/link";
import { legalEntityName, legalContactLine, legalJurisdiction } from "@/lib/legal-config";

export const metadata: Metadata = {
    title: "Terms of Service | Hotel AI",
    description: "Terms of Service for Hotel AI — SaaS for hotels in India.",
};

export default function TermsOfServicePage() {
    const contact = legalContactLine();
    const entity = legalEntityName;
    const jurisdiction = legalJurisdiction;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                        ← Back
                    </Link>
                    <span className="text-sm font-medium">Terms of Service</span>
                </div>
            </header>

            <article className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
                <p className="text-xs text-muted-foreground">
                    Effective date: 15 March 2026 · For customers and users in India only
                </p>

                <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
                <p>
                    These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Hotel AI software platform and related services (collectively, the &quot;Service&quot;) provided by <strong className="text-foreground">{entity}</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By registering for an account, accessing, or using the Service, you agree to these Terms on behalf of yourself and, where applicable, the hotel or legal entity you represent (&quot;you&quot; or &quot;Customer&quot;).
                </p>
                <p>
                    The Service is offered to <strong className="text-foreground">hotels and hospitality businesses operating in India</strong>. If you do not agree, do not use the Service.
                </p>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">1. The Service</h2>
                    <p>
                        Hotel AI provides cloud-based tools for hotels, which may include (depending on your subscription or configuration) digital menus, room-linked ordering, kitchen and operations dashboards, staff accounts, service request workflows, and related features. We may modify, add, or discontinue features with reasonable notice where practicable; material adverse changes may be addressed as agreed in separate commercial terms if any.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">2. Eligibility and accounts</h2>
                    <p>
                        You represent that you are at least eighteen (18) years of age and have authority to bind the hotel or business entity on whose behalf you register. You are responsible for maintaining the confidentiality of login credentials and for all activity under your account. You must notify us promptly of any unauthorised use.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">3. Customer data and guests</h2>
                    <p>
                        You may upload or generate data through the Service, including hotel profile information, menu content, room data, and data relating to guest orders or requests (&quot;Customer Data&quot;). You retain ownership of your Customer Data subject to the licence below. You are responsible for ensuring that your collection and use of guest or staff data complies with applicable Indian law (including the DPDPA and other applicable privacy requirements) and for providing any required notices or obtaining consents from data principals where required.
                    </p>
                    <p>
                        You grant us a non-exclusive, worldwide licence to host, process, transmit, and display Customer Data solely to provide, secure, and improve the Service and as described in our Privacy Policy.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">4. Acceptable use</h2>
                    <p>You agree not to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Use the Service for any unlawful purpose or in violation of Indian law.</li>
                        <li>Attempt to gain unauthorised access to the Service, other accounts, or our systems.</li>
                        <li>Introduce malware, overload infrastructure, or interfere with other users.</li>
                        <li>Use the Service to transmit harassing, defamatory, or infringing content.</li>
                        <li>Reverse engineer or attempt to extract source code except where permitted by law.</li>
                    </ul>
                    <p>We may suspend or terminate access for breach of these Terms or to protect the Service or other users.</p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">5. Fees</h2>
                    <p>
                        If you subscribe to a paid plan, fees, billing cycle, and taxes (including applicable GST in India) will be as set out in your order form, invoice, or in-app terms. Failure to pay may result in suspension. Free trials or promotional access may be modified or ended at our discretion with notice where reasonable.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">6. Intellectual property</h2>
                    <p>
                        We and our licensors own all rights in the Service, software, branding, and documentation, excluding your Customer Data. No rights are granted except the limited right to use the Service during the term in accordance with these Terms.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">7. Confidentiality</h2>
                    <p>
                        Each party may receive non-public information from the other. The receiving party will use reasonable care to protect such information and use it only for the purpose of the Service, subject to standard exceptions (public domain, independently developed, required by law, etc.).
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">8. Disclaimers</h2>
                    <p>
                        The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis to the fullest extent permitted by applicable law in India. We disclaim implied warranties of merchantability, fitness for a particular purpose, and non-infringement where disclaimers are permitted. We do not guarantee uninterrupted or error-free operation.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">9. Limitation of liability</h2>
                    <p>
                        To the maximum extent permitted by applicable law in India, neither party will be liable for indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or goodwill, arising from these Terms or the Service, except where such exclusion is not enforceable.
                    </p>
                    <p>
                        Our aggregate liability arising out of or relating to the Service or these Terms shall not exceed the greater of (a) the fees paid by you to us for the Service in the three (3) months preceding the claim, or (b) INR 10,000, except for liability that cannot be limited under applicable law (such as fraud or wilful misconduct, where applicable).
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">10. Indemnity</h2>
                    <p>
                        You will defend, indemnify, and hold harmless {entity} and its affiliates, officers, and employees from claims, damages, and costs (including reasonable legal fees) arising from your Customer Data, your use of the Service in breach of these Terms, or your violation of applicable law or third-party rights, except to the extent caused by our wilful misconduct.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">11. Term and termination</h2>
                    <p>
                        These Terms remain in effect while you use the Service. You may stop using the Service at any time. We may suspend or terminate access for breach, non-payment, legal requirement, or discontinuation of the Service with reasonable notice where practicable. Upon termination, your right to use the Service ceases; we may delete Customer Data after a reasonable retention period consistent with our Privacy Policy and law.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">12. Governing law and jurisdiction</h2>
                    <p>
                        These Terms are governed by the <strong className="text-foreground">laws of India</strong>, without regard to conflict-of-law principles. Subject to mandatory provisions of Indian law, you agree that the courts at <strong className="text-foreground">{jurisdiction}</strong> shall have exclusive jurisdiction over disputes arising from these Terms or the Service.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">13. General</h2>
                    <p>
                        If any provision is held invalid, the remainder remains in effect. Failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign in connection with a merger or sale of assets. Notices may be given via email or through the Service.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground pt-2">14. Contact</h2>
                    <p>
                        Questions about these Terms: <strong className="text-foreground">{contact}</strong>
                    </p>
                </section>

                <p className="text-xs pt-4 border-t border-border">
                    <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                    </Link>
                </p>
            </article>
        </div>
    );
}
