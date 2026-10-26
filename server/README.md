# Arcane project enquiry email handler

The homepage's two hero buttons open the project-concierge dialog. The greeting
uses the same browser voice selection as the existing Arcane assistant; the
visitor can stop or replay it. Text remains available when speech is unsupported.

Install `arcane-lead.php` directly in `/home/arcane/public_html/` on the website's
CWP server (136.243.106.42), alongside `index.html`. Do not put it in `/api/`, which
the website deliberately blocks. The existing static updater preserves this
manually installed file; it does not deploy PHP or other server-side code.

The handler needs PHP 5.6 or newer, private writable storage in `/home/arcane`,
and the host's PHP `mail()` transport. Messages are addressed only to
`info@arcane.ae`, from `website@arcane.ae`, with the validated visitor email in
Reply-To. No mailbox credentials are embedded. A positive mail result means
the hosting mail transport accepted the message; verify actual inbox delivery
with an authorised test before considering email delivery confirmed.

Private enquiry copies are held under `/home/arcane/.arcane-enquiries` with
0700/0600 permissions and removed after 90 days on subsequent submissions.
Enquiries are never committed to GitHub. The public frontend does not save
contact details in browser storage. CSRF/session checks, explicit contact
consent, a honeypot, field validation, duplicate-request protection and an
hourly per-client limit apply. Mail failure returns an error, retains the
private failed record, and leaves the visitor's entered details in the form.

The submit destination is `/arcane-lead.php`. A GET returns only an essential
session token and request identifier, with no-store headers. Email and telephone
links remain available if the endpoint is unavailable.

Validation: `scripts/test-lead-handler.php` uses an injected mail transport and
does not send real email. Browser previews simulate success and failure only;
preview-only server configuration is excluded from the repository and deployment.
