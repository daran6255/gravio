// Raw markdown body rendered by PrivacyPolicyPage. Kept as data (not JSX) so the
// legal text can be reviewed/edited on its own, separate from page layout code.
const privacyPolicyContent = `
# Privacy Policy — Gravit

**Effective Date:** 27th July 2026 \n
**Last Updated:** 27th July 2026

---

> **Note before publishing:** This document is a detailed, GDPR-aligned draft built specifically around Gravit's actual data practices (CRM, Projects, Timesheets, HR & Payroll, Meeting Booking, and the IRIS AI agent). Placeholders like \`[Insert ...]\` need to be filled in with your legal entity details, and the finished document should be reviewed by a qualified data protection lawyer before publication — this is standard practice for any privacy policy and isn't a reflection of anything missing here.

---

## 1. Introduction

Gravit ("**Gravit**," "**we**," "**us**," or "**our**") is a unified business operations platform provided by **[Insert Legal Entity Name, e.g. Taydens Pvt. Ltd.]** ("**Taydens**," "**the Company**"). Gravit brings together CRM, project management, timesheets & billing, HR & payroll, meeting scheduling, and IRIS — our built-in AI agent — into a single workspace for small and medium-sized businesses.

This Privacy Policy explains, in plain terms:
- what personal data we collect and where it comes from,
- why we collect it and what we do with it,
- where and how it's stored and protected,
- the legal basis we rely on to process it,
- how long we keep it,
- who we share it with,
- and the rights you have over your own data.

This Policy applies to everyone who uses Gravit — account owners, team members invited into a workspace, and individuals whose data is entered into Gravit by our customers (for example, a CRM lead or an employee record). It is written to meet the requirements of the **EU/UK General Data Protection Regulation (GDPR)**, and applies to all users regardless of location, as a matter of consistent practice.

---

## 2. Who Controls Your Data

For data relating to your own Gravit account (your name, login email, billing details), **Taydens** is the **Data Controller**.

For data that our business customers ("**Organizations**") enter into Gravit about their own employees, leads, clients, or candidates (for example, a company using Gravit's HR module to store its employees' payroll data), the **Organization is the Data Controller**, and **Taydens acts as a Data Processor**, processing that data only on the Organization's documented instructions, as governed by our Data Processing Agreement (DPA) with that Organization.

If you are an employee, lead, or contact whose data appears in someone else's Gravit workspace, and you have questions about that data, you should contact that Organization directly. Taydens will support that Organization in responding to you, as required under GDPR.

**Data Protection contact:**
[Insert Company Name]
[Insert Registered Address]
Email: [Insert privacy@yourdomain.com]
Data Protection Officer (if appointed): [Insert Name/Contact or "Not applicable — contact the above email"]

---

## 3. What Personal Data We Collect, Where It Comes From, and Where It's Stored

We only collect personal data that is necessary to provide and secure the Gravit service. The table below maps each category of data to its source, its purpose, and where it lives — in line with GDPR's transparency and data-mapping requirements.

| Data Category | Examples | Where It Comes From | How We Use It | Where It's Stored |
|---|---|---|---|---|
| **Account & identity data** | Full name, work email, phone number, job title, company name | Provided directly by you at sign-up or when invited to a workspace | Account creation, authentication, workspace access, communication | Primary application database, hosted at [Insert region/provider, e.g. AWS ap-south-1] |
| **Billing & payment data** | Billing name, address, GSTIN (if applicable), plan tier, invoice history. **Full card/payment credentials are handled entirely by our payment processor and are never stored on Gravit's own servers.** | Provided by you during checkout/upgrade | Subscription billing, invoicing, tax compliance, fraud prevention | Payment tokens and transaction records held by our PCI-DSS compliant payment processor ([Insert processor name, e.g. Razorpay/Stripe]); billing metadata (plan, invoice number, amount) stored in our application database |
| **CRM data** | Lead/contact names, emails, phone numbers, company details, deal values, notes, activity history | Entered by users of an Organization's workspace, or imported from spreadsheets/other tools | Enabling the Organization's sales pipeline management | Primary application database, scoped to the Organization's tenant |
| **HR & payroll data** | Employee records, department/designation, salary structure, payslips, leave records, uploaded HR documents | Entered by an Organization's HR/admin users | Enabling payroll processing, leave management, document storage for the Organization | Primary application database and secured document storage, scoped to the Organization's tenant; salary and payslip data held with additional access restrictions (see Section 8) |
| **Project & timesheet data** | Task assignments, project notes, logged hours, billing flags | Entered by users during normal use of the Projects/Timesheets modules | Project tracking, time-based billing | Primary application database, scoped to the Organization's tenant |
| **Meeting & booking data** | Meeting attendee names/emails, scheduled times, meeting links, reschedule/cancellation history | Entered by users or booked by external invitees via public booking pages | Scheduling and calendar coordination | Primary application database; where a user connects Google Meet or a similar calendar integration, data also passes through that third-party provider under their own terms |
| **IRIS (AI agent) interaction data** | Prompts/requests sent to IRIS, and the records IRIS reads or creates on your behalf across CRM/Projects/HR/Timesheets/Booking | Generated when a user interacts with IRIS | Carrying out the specific action requested (e.g. "create a follow-up task"), and maintaining an audit log of AI actions for reliability and billing purposes | Primary application database (request logs and audit trail); prompts are transmitted to our AI model providers only for the duration needed to generate a response — see Section 10 |
| **Technical & usage data** | IP address, browser/device type, login timestamps, pages visited, error logs | Collected automatically when you use Gravit | Security, fraud detection, service reliability, diagnosing issues | Application logs and monitoring infrastructure, retained per the schedule in Section 7 |
| **Support communications** | Emails, chat messages, or form submissions sent to our support/contact channels | Provided by you when you contact us | Responding to your query, improving the product | Support/helpdesk system, and internal records for as long as needed to resolve and document the matter |

We do **not** knowingly collect any "special category" data (as defined under GDPR Article 9 — e.g. health data, religious beliefs, biometric data) as a core part of the Gravit product. If an Organization chooses to store such data in free-text fields (for example, a medical leave note), that Organization is responsible for ensuring it has a valid lawful basis to do so, and we recommend against storing special category data in free-text fields wherever possible.

---

## 4. Our Lawful Basis for Processing Your Data

Under GDPR, we must have a valid legal basis for every use of personal data. We rely on the following, depending on the data and context:

- **Contract (Article 6(1)(b)):** Processing your account, billing, and workspace data is necessary to provide the Gravit service you've signed up for — we can't run your CRM, payroll, or scheduling without processing the data needed to do so.
- **Consent (Article 6(1)(a)):** Where we ask for it specifically — for example, optional marketing emails, or optional cookies beyond what's strictly necessary for the site to function — we rely on your freely given, informed, and specific consent, which you can withdraw at any time (see Section 6).
- **Legitimate interests (Article 6(1)(f)):** For security monitoring, fraud prevention, service improvement, and maintaining audit logs of AI actions, we rely on our legitimate interest in operating a secure and reliable service — balanced against your right to privacy, and never overriding your interests or fundamental rights.
- **Legal obligation (Article 6(1)(c)):** For billing records, tax invoices, and responses to lawful requests from authorities, we process data as required to meet our legal and regulatory obligations.

We do **not** process personal data for purposes incompatible with the reasons above, and we do not use client data for any purpose beyond delivering, securing, and improving the Gravit service — we will never use your data, or your Organization's data, for unrelated commercial purposes without a clear, separate legal basis and, where required, your explicit consent.

---

## 5. How We Use Your Data — In Plain Terms

We use personal data only to:
1. Create and manage your account and workspace
2. Provide the core features you use — CRM, Projects, Timesheets, HR & Payroll, Booking, and IRIS
3. Process payments and generate invoices
4. Communicate with you about your account, service updates, or support requests
5. Maintain the security, integrity, and reliability of the platform
6. Meet our legal and tax obligations
7. With your consent, send you product updates or marketing communications (you can opt out at any time)

We do **not** sell personal data to third parties. We do not use your personal data to train any third-party or foundation AI model — see Section 10 for full detail on how IRIS handles your data.

---

## 6. Consent

Where we rely on your consent — for example, optional marketing communications or non-essential cookies — we ensure that consent is:
- **Freely given** — you are never forced to consent as a condition of using core features you're entitled to
- **Specific and informed** — we clearly explain what you're consenting to before you do
- **Unambiguous** — we use clear affirmative action (e.g. a checkbox), never pre-ticked boxes or default opt-ins for non-essential processing
- **As easy to withdraw as to give** — you can withdraw consent at any time via your account settings or by emailing us, and we will stop the relevant processing promptly once you do

Withdrawing consent does not affect the lawfulness of processing carried out before the withdrawal, and does not affect processing we carry out under a different lawful basis (for example, we will still need to process your billing data under "contract" even if you withdraw marketing consent).

---

## 7. How Long We Keep Your Data

We retain personal data only for as long as necessary for the purposes described in this Policy:

| Data Type | Retention Period |
|---|---|
| Active account & workspace data | For as long as your account/Organization remains active on Gravit |
| Billing & invoice records | [Insert period, e.g. 7 years], as required by applicable tax and financial regulations |
| Data after account cancellation | Retained for [Insert period, e.g. 30-90 days] to allow recovery if cancellation was in error, then permanently deleted or anonymized, unless a longer period is required by law |
| Support communications | [Insert period, e.g. 2 years] from resolution, for quality and audit purposes |
| Technical/security logs | [Insert period, e.g. 12 months], for security monitoring and fraud prevention |
| IRIS interaction/audit logs | [Insert period, e.g. 12 months], to support reliability, dispute resolution, and billing accuracy |

When retention periods expire, data is securely deleted or irreversibly anonymized.

---

## 8. Data Security

We take the protection of your data seriously and implement layered technical and organizational measures, reviewed and updated on an ongoing basis to address emerging risks:

- **Encryption** — personal data is encrypted in transit (TLS/HTTPS across the entire application) and at rest in our production databases and document storage.
- **Secured storage systems** — production data is hosted in access-controlled, monitored cloud infrastructure with regular backups; payment credentials are never stored on our own servers and are handled exclusively by our PCI-DSS compliant payment processor.
- **Controlled access** — access to personal data is restricted on a least-privilege, role-based basis; internal staff can only access the data necessary for their role, and all access is logged.
- **Tenant isolation** — each Organization's data (CRM records, HR data, projects, etc.) is logically separated so that one Organization can never access another's data.
- **Regular review** — we periodically review our security practices, dependencies, and access controls to identify and remediate potential risks, and we maintain incident response procedures to act quickly if an issue is identified.
- **Breach notification** — in the event of a personal data breach that poses a risk to your rights and freedoms, we will notify the relevant supervisory authority within 72 hours of becoming aware of it, and will notify affected users/Organizations without undue delay, as required under GDPR Articles 33 and 34.

No system can guarantee absolute security, but we are committed to using industry-standard safeguards and to continuously improving them.

---

## 9. Your Rights Under GDPR

If you are located in the EEA/UK, or regardless of location as a matter of our standard practice, you have the following rights over your personal data:

- **Right of access** — request a copy of the personal data we hold about you.
- **Right to rectification** — ask us to correct inaccurate or incomplete data.
- **Right to erasure ("right to be forgotten")** — ask us to delete your personal data, subject to certain legal exceptions (e.g. data we must retain for tax/legal reasons).
- **Right to restrict processing** — ask us to limit how we use your data in certain circumstances.
- **Right to data portability** — request your data in a structured, commonly used, machine-readable format, and have it transmitted to another provider where technically feasible.
- **Right to object** — object to processing based on legitimate interests, or to direct marketing at any time.
- **Rights related to automated decision-making** — Gravit's IRIS agent acts on user instructions and does not make fully automated decisions that produce legal or similarly significant effects on individuals without human involvement; where any such automated processing is introduced in the future, we will provide the safeguards required under Article 22, including the right to request human review.

**How to exercise your rights:** Email [Insert privacy@yourdomain.com] with your request. We will respond within **one month**, as required under GDPR (extendable by a further two months for complex requests, in which case we will explain why). We may need to verify your identity before actioning a request, to protect your data from unauthorized access.

If your data is held within an Organization's workspace (e.g. you're an employee in someone's HR module), we will direct your request to that Organization where they are the Controller, and support them in fulfilling it.

**Right to complain:** If you believe we have not handled your data properly, you have the right to lodge a complaint with your local data protection supervisory authority — in Ireland, the Data Protection Commission; in the UK, the Information Commissioner's Office (ICO); or the relevant authority in your EU member state.

---

## 10. IRIS and AI Processing — What Happens to Your Data

IRIS is Gravit's built-in AI agent, and we want to be direct about how it handles your data:

- **We do not train any AI model — ours or our providers' — on your data.** Prompts and business data sent to IRIS are used solely to generate the specific response or action you requested, in that moment, and are not used to train, fine-tune, or improve any underlying AI model.
- IRIS is powered by third-party AI model providers (currently Groq and Google Gemini). These providers process the data required to generate a response but do so under contractual terms that prohibit using your data to train their models.
- Data sent to these providers is limited to what's needed to fulfil the specific request (e.g. the relevant CRM record and your instruction), not your entire workspace.
- We keep an internal audit log of IRIS's actions (what was requested, what was changed) for reliability, billing accuracy, and so you can review what IRIS did on your behalf — this log is treated with the same security protections as the rest of your data.
- If our approach to AI processing changes in the future — for example, if we introduce an opt-in feature that does use data for model improvement — we will update this Policy and seek your explicit consent before enabling anything like that.

---

## 11. Who We Share Your Data With

We share personal data only where necessary, and always under appropriate contractual safeguards (Data Processing Agreements where required):

- **Infrastructure & hosting providers** — [Insert provider, e.g. AWS/Azure/GCP] for hosting our application and databases.
- **Payment processors** — [Insert processor, e.g. Razorpay/Stripe] for handling billing and payment credentials.
- **AI model providers** — Groq and Google Gemini, solely to process IRIS requests as described in Section 10.
- **Communication tools** — [Insert e.g. email delivery provider] for transactional emails (invoices, notifications, password resets).
- **Calendar/meeting integrations** — where you choose to connect Google Meet or similar, for the Booking module.
- **Legal & regulatory bodies** — where required to comply with a legal obligation, court order, or enforceable governmental request.

We do not sell, rent, or trade personal data to third parties for their own marketing purposes.

---

## 12. International Data Transfers

Where personal data is transferred outside the EEA/UK (for example, to a hosting region or an AI provider located elsewhere), we ensure an adequate level of protection through mechanisms such as the European Commission's Standard Contractual Clauses (SCCs), or transfers to countries covered by an adequacy decision, as required under GDPR Chapter V.

---

## 13. Cookies

Gravit uses only the cookies strictly necessary for the website and application to function (e.g. session/authentication cookies), plus optional analytics/preference cookies where you've given consent. For full detail, see our separate [Cookie Policy] link in the footer, where you can also manage your preferences at any time.

---

## 14. Children's Privacy

Gravit is a business tool intended for use by individuals aged 18 and over acting in a professional capacity. We do not knowingly collect personal data from children, and Gravit is not directed at or intended for use by minors.

---

## 15. Changes to This Policy

We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or the Gravit product itself. We will post the updated Policy with a new "Last Updated" date, and where changes are material, we will notify you directly (e.g. by email or an in-app notice) before they take effect.

---

## 16. Contact Us

If you have any questions about this Privacy Policy or how we handle your data, please contact us:

**[Insert Company Legal Name]**
[Insert Registered Address]
Email: [Insert privacy-policy@gravit.taydens.com]

---

*This Privacy Policy is designed to reflect Gravit's actual data practices in line with GDPR principles of lawfulness, fairness, transparency, purpose limitation, data minimization, accuracy, storage limitation, integrity, confidentiality, and accountability. It should be reviewed by qualified legal counsel before publication to ensure it fully reflects your specific legal entity structure, jurisdictions of operation, and any local law requirements beyond GDPR.*
`;

export default privacyPolicyContent;
