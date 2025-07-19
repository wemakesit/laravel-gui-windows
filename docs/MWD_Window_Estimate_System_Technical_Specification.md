# Window Estimate System – Technical Specification for Review

This document outlines the agreed scope, workflow, technology architecture, and essential specifications for your window company’s new digital estimation platform. Review and verify each section to confirm requirements before development begins. This is to outline initial specifications to enable planning.

## 1. Project Overview

- **Purpose:** Provide sales staff with an intuitive, offline-first system to generate window estimates and quotations on-site or in the office.
- **Devices:** Microsoft Surface Pro (touch/camera enabled).
- **MVP Focus:** Clean, rapid workflow, accurate pricing, mandatory media, and robust data handling. Features are phased for future scalability.

## 2. Workflow Summary

### Data Flow & Integration

- Leads originate via web forms, auto-added to Monday.com CRM.
- Appointment data pre-fills estimate user records.
- Wizard/pipeline interface guides users through customer detail, window entry, extras, and image attachment.
- Completed quotes synced to cloud when online, with PDFs generated and sent to clients by email.

## 3. Application Architecture

| Layer | Technology | Purpose/Role |
| :-- | :-- | :-- |
| Frontend | Electron + React | Main quoting interface. Stepwise wizard. Surface Pro optimised. |
| Local Storage | PouchDB | Full offline capability, immediate access to all records. |
| Cloud Sync | CouchDB | Background sync of estimates, catalogue and user data. |
| Backend API | Python FastAPI | Pricing logic, validation, PDF/image packaging, sync controller. |
| Media Storage | S3/Pouch/Couch | Stores all estimate images and final documents. |
| Address Lookup | Address lookup service | Reduces manual entry, ensures address accuracy. |
| Product Data | Window/Product APIs | Provides up-to-date window types, extras, finishes. |

## 4. User Experience & Interface

- **Wizard-style workflow:** Step-by-step, touch-first design. Mandatory actions (photos per window) require user confirmation if skipped.
- **Tree view:** Enables reordering and duplication of window/door items for speed and consistency on bulk jobs.
- **Photo capture:** Each line has a thumbnail image or documented reason for omission.
- **PDF output:** Branded, clear; with configurable contact details, logo, and accreditation placeholders from admin panel.
- **Quick data entry:** Pre-filled customer details from Monday.com CRM and auto-generated reference numbers for GDPR.

## 5. Pricing, Quoting, and Validation Logic

- **Central price catalogue:** Editable only by admins in a secure backend.
- **Discounts/overrides:**
  - Field users may discount up to 5%, subject to configurable per-user permissions.
  - Manual line item overrides are logged and displayed (e.g., highlighted red).
  - Out-of-range discounts/adjustments prompt warnings and require higher approval.
- **Pricing types supported:** Square metre, linear metre, quantity, percentage, positive/negative line items (“extras” and reductions).
- **Calculation transparency:** Each estimate shows how pricing is built (including base, overrides, extras, and validation highlights).

## 6. Administration, Permissions, & Security

- **Role-based access:**
  - Sales: Limited overrides, quote creation.
  - Admins: Full system and pricing control, config access.
  - Office: Review and edit access for quotes and records.
- **Company configuration:** System supports multiple companies, each with unique branding and price lists if required.
- **Admin interface:** All catalogue/product/branding edits via secure web portal (no flat files or CSV edits).
- **Security & compliance:** Device data is encrypted; GDPR-compliant workflows (reference numbers, optional redaction for workshop screens).

## 7. Data & Reporting

- **Relational database backend:** No CSV/JSON file reliance; full query, filter, and reporting support.
- **Reporting:** Query lists for quotes missing images, price overrides, status (pending, won, lost—with required reason for each).
- **Change log:** Every edit, override, and status change is time/user-stamped.

## 8. Output Document & Branding

- **Professional PDFs:** Consistent format for all estimates/quotes, minor user/client branding tweaks available from admin panel.
- **Mandatory image thumbnails:** Visual references for every window, unless user documents reason for omission.
- **Style templates:** Configurable per company for future SaaS/licensing use.

## 9. Future-Proofing & Extensibility

- **Multi-company, multi-tenant ready:** Architecture supports new clients, brand, and data segregation.
- **Expandable integrations:** Designed for export to manufacturing/order/CAD processes; e-signature and analytics support in future phases.
- **No legacy technology:** Entirely new build—no reliance on flat files or legacy admin panels.

## 10. Agreed Development & Rollout Plan

- **Alpha:** Internal device testing (functional UI with local data).
- **Beta:** Limited live trial with selected staff, feedback cycle.
- **Production:** Full rollout after feedback, training, and documentation.
- **Change control:** Fixed-price per milestone, all new features/scopes scoped and costed separately.
- **Ongoing support:** Regular updates, bug fixing, and versioning post-launch.

## 11. Immediate Next Steps

1. Confirm acceptance of this specification (or raise clarifications).
2. Review and confirm elements required for MVP

**Please review this specification thoroughly and provide any amendments or questions at your earliest convenience. Adjustments can be made before development of MVP commences to ensure perfect alignment with your goals and workflow.**
