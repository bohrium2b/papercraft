# Enterprise Security & Compliance Plan

## Feature Intent

Security in Papercraft is designed around the trust model of educational institutions: exam content is sensitive, but the user base is small and vetted. The primary controls are encryption (AES-256 at rest, TLS 1.3 in transit), SSO integration with existing school directories, and cryptographic watermarking on every exported PDF so that leaked papers can be traced back to the exporting user and timestamp.

The AI privacy boundary is particularly strict. A `PromptSanitizer` strips all PII before any item content is sent to external LLM APIs, and institutions can toggle AI features off entirely. For schools with data-sovereignty requirements, a self-hosted Ollama + Llama 3 fallback is documented.

Access control is intentionally simple — a single `can_approve` flag — because Papercraft does not enforce data isolation between departments. Rate limiting, CSRF protection, CSP headers, and encrypted backups round out the compliance posture.

## Encryption

### Data at Rest
- **PostgreSQL:** AES-256 via filesystem encryption (LUKS) or cloud provider disk encryption
- **ActiveStorage files:** Local disk encrypted via LUKS; no plaintext backups
- **Redis:** Memory-only (no RDB/AOF persistence) or encrypted if persisted

### Data in Transit
- TLS 1.3 enforced via Nginx
- HSTS header: `max-age=31536000; includeSubDomains`
- Certificate auto-renewal via certbot

## Audit & Traceability

### Approval History Only
```ruby
class ItemRevisionTransition < ApplicationRecord
  belongs_to :item
  belongs_to :reviewer, class_name: "User", optional: true
  # columns: from_status, to_status, comment, created_at
end
```

Audit logging is restricted to **item review transitions** (submit, approve, request revisions). There is no global audit callback on `ApplicationRecord`. This is intentional — with no data isolation between departments, there are no access violations to audit-track.

### Retention
- Transitions retained indefinitely (they are part of the item's approval history)
- No partitioning needed (volume is low: one transition per state change per item)

## Watermarking
- **Visible watermark:** User name + timestamp + IP in PDF footer (Prawn text)
- **Hidden watermark:** PDF metadata dictionary + invisible text layer
- **Embedding:** During PDF compilation, inject watermark text at 1pt opacity

```ruby
class PdfKit::WatermarkInjector
  def inject(pdf_path, user)
    pdf = CombinePDF.load(pdf_path)
    pdf.pages.each do |page|
      page.textbox "#{user.name} | #{Time.current} | #{user.current_sign_in_ip}",
        at: [10, 10], size: 1, opacity: 0.01
    end
    pdf.save pdf_path
  end
end
```

## AI Data Privacy
- **ZDR enforcement:** Prompt payload audit; no PII transmitted
- **Prompt sanitization:** Remove names, IDs, institution-specific data via `PromptSanitizer` before external API calls
- **Opt-in/opt-out:** Institution-level toggle; if off, AI features disabled
- **Self-hosted fallback:** Documented deployment of local LLM (Ollama + Llama 3)
- **No student data sent externally:** The system does not ingest student work, so the primary privacy control is architectural — no student PII exists to leak

## SSO & Identity
- SAML 2.0 metadata URL configuration
- OIDC discovery endpoint
- Just-in-time provisioning: SSO creates user on first login
- Account linking: local + SSO mapped to same user record

## Access Controls
- **Rate limiting:** 100 requests / 15 min per user; 20 requests / 15 min per IP
- **CSRF:** Standard Rails tokens + SameSite cookies
- **CORS:** Strict origin allowlist
- **Security headers:** CSP, X-Frame-Options, X-Content-Type-Options via `secure_headers`

## Backup Security
- Backups encrypted at rest (GPG symmetric or AES-256)
- Offsite copy uploaded to encrypted S3-compatible bucket (optional)
- Restore tested monthly; results documented

## Compliance Documentation
- SOC 2 Type II checklist (access control, audit logging, encryption)
- Data Processing Agreement (DPA) template for institutions
- Incident response runbook (data breach, unauthorized access)

## Removed from Previous Plan
- ~~Global `ApplicationRecord` audit callbacks~~ — causes infinite recursion via `AuditLog` creation and is unnecessary without data isolation
- ~~Partitioned audit log table~~ — replaced by lightweight `ItemRevisionTransition` (no partitioning needed at expected volume)
- ~~`organization_id` on audit records~~ — no org-level access segregation to track
