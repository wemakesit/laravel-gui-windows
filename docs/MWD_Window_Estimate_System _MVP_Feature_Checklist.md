# Window Estimate System – MVP Feature Checklist

Below is a tick-list of features and capabilities for the **Minimum Viable Product (MVP)**. Please use this checklist to confirm which items are required for launch, and note any features for discussion or later phases. This ensures mutual clarity on project scope before development begins.

## 1. Project Goals & Core Use

- [ ] Sales staff can generate estimates and quotes on-site or in the office (offline-first)
- [ ] Standardised use of Microsoft Surface Pro (touch/camera enabled)
- [ ] Rapid, accurate workflow; future enhancements can be added over time

## 2. Workflow & Integration

- [ ] Leads imported from web forms and Monday.com CRM
- [ ] Appointment details automatically pre-fill estimation records
- [ ] Guided, wizard-style interface for step-by-step estimate creation
- [ ] Each quote synced to cloud when online
- [ ] Final PDFs generated and sent to customers by email

## 3. User Experience & Interface

- [ ] Touch-friendly, stepwise workflow
- [ ] Tree view for managing, reordering, and duplicating windows/doors on each job
- [ ] Per-window photo capture, with a prompt if skipped (user must confirm reason)
- [ ] Customer data automatically filled in; GDPR-compliant reference numbers generated
- [ ] PDF output is branded and clear, with minor editable details and user/company options

## 4. Pricing, Quoting & Validation

- [ ] Centrally managed price catalogue, maintained by admin only
- [ ] Field staff can apply discounts up to 5% (configurable per user)
- [ ] Manual price overrides clearly highlighted and logged
- [ ] Out-of-range price changes trigger warnings and require approval
- [ ] All calculation types supported (square metre, linear metre, quantity, percentage, as well as extras/reductions)
- [ ] Transparent itemised breakdown of all pricing in each estimate/quote

## 5. Administration, Permissions & Security

- [ ] Role-based access (Sales, Admin, Office), with clearly defined permissions
- [ ] Editable company branding and price lists if more than one company
- [ ] All admin changes/editing via a secure web portal (never direct files/CSVs)
- [ ] Device data encrypted and GDPR-compliant, including optional redaction for production/workshop use

## 6. Data Handling & Reporting

- [ ] All core data stored in a relational database (no CSV/JSON reliance)
- [ ] Reports can filter for:
  - Quotes missing images
  - Used overrides/discounts
  - Quote status (pending/won/lost), with reasons captured for lost/won
- [ ] Every record/change is time- and user-stamped

## 7. Output Document & Branding

- [ ] PDF quotes/estimates are generated in consistent, professional format
- [ ] Every window/door line includes a thumbnail image, or a documented reason for omission
- [ ] Document style templates can be configured per company to support future scaling/licensing if needed

## 8. Delivery & Rollout

- [ ] Alpha phase: Internal device testing (local only)
- [ ] Beta phase: Limited live field/office trial with feedback
- [ ] Production phase: Go-live after training and review
- [ ] Fixed-price, milestone-based delivery, with clearly scoped changes only
- [ ] Support: Regular updates, fixes, and formal versioning included

**Instructions:**
Tick any feature required in your MVP. Use comments or margin notes to highlight questions, clarifications, or features to postpone for later stages. When reviewed and agreed, this list will form the foundation for the development sprints and delivery plan.
