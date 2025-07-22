# Meeting Summary – Estimation Software - 17 Jul 2025

This summary captures the main decisions, requirements, and immediate next steps discussed for the digital estimation and quoting platform for the Midhurst Windows and Doors.

### Project Direction and Process

- **Objective:** Bring estimation and quotation into a modern, digital workflow, letting sales staff produce accurate, fast estimates on-site or in the office.
- **Approach:** Work in quick, focused steps, release a working Minimum Viable Product (MVP) first, then add features based on feedback and future needs.
- **Method:** Short development cycles with frequent reviews and feedback to keep on track and responsive to changes.

### Field Use and Device Choices

- **Functionality without Internet:** The tool must work perfectly even without Wi-Fi or mobile data. Local data storage and later synchronisation are essential.
- **Standard Device:** All field work will be on Microsoft Surface Pro tablets, using their built-in camera for photos and a touch-friendly interface optimised for speed.
- **Photo Capture for Each Window:** Each quote line should have a linked photo. There’s a prompt if skipped, but users can intentionally move on if a photo isn’t possible (for example, windows that aren’t visible).
- **Quick Data Entry:** Customer data, including name, address, and reference number, should auto-fill from the CRM wherever possible to streamline quoting.

### Workflow and User Experience

- **Lead to Quote Pipeline:** Leads come from the website into Monday.com; key details auto-populate in the estimation system for appointments.
- **Step-by-Step Guidance:** The quote process uses a wizard-style interface, guiding users through customer details, products, features, photos, and quote output.
- **Item Management:** Quotes are organised using a “tree view” where windows/doors can be reordered, edited, and quickly duplicated for similar units.
- **PDF Quotes:** Well-structured, branded document output is generated at the end of the process. The format remains consistent, with only minor editable sections (user details, logos).

### Quote Rules and Pricing

- **Instant Pricing Results:** As users enter details, prices update immediately. The system supports direct price overrides and both per-item and whole-quote discounting.
- **Controlled Central Pricing:** A master price list is held and edited only by admin users. Sales can override prices up to a set limit (e.g., 5%), with all changes flagged for review.
- **Validation and Error Prevention:** The system includes caps for discounts or adjustments and visible warnings for unusual or large changes.
- **Flexible Calculation Logic:** Pricing supports calculations by square metre, linear metre, quantity, and percentage. Removals or “extras” can use negative or positive line items in the quote.

### Data Integration and Flow

- **CRM Sync:** Seamless integration with Monday.com, minimising data entry errors and ensuring GDPR compliance by assigning reference numbers instead of names on workshop lists.
- **Quote Statuses:** The platform tracks stages estimate, quote, live, lost/won—with spaces to record reasons for sales outcomes.
- **Manufacturing Preparation:** Information collected at estimation will eventually feed technical drawings and manufacturing orders, eliminating re-entry and risk of errors.

### User Access and Security

- **Role-Based Control:**
  - Sales: Limited discounting or overrides.
  - Admins: Full system control, including pricing and structure.
- **Permissions:** Fine-grained, user-level access. Designed from the start to support multiple companies, with future multi-tenant use and licensing in mind.
- **Security:** All data stored on devices is encrypted; robust authentication throughout.

### Reporting and Analytics

- **Interrogatable Data:** Advanced filtering options to find, for example, quotes with missing images, overridden prices, or lost/won sales (with reasons).
- **Relational Database Model:** Moving away from CSV/JSON to structured, scalable storage for better future reporting.

### Rollout and Support

- **Testing:** Begin with internal (alpha) trials, then limited beta testing, before full team rollout.
- **Change Control:** Clear, fixed-price development phases; new features are tracked and quoted separately once the baseline is stable.
- **Ongoing Support:** Regular updates, incremental improvements, robust documentation, and transparent version control.

### Future Expansion

- **Multi-Company Use:** Designed from the start to support multiple window businesses with unique branding and pricing structures.
- **Licensing:** Flexibility for subscription-based distribution or licensing the finished product while keeping code ownership options open.
- **Manufacturing Link-Up:** Plans to join up the estimate/quote system with technical drawings and factory order processing, to speed up the full workflow and remove manual steps.

### Immediate Next Steps

1. Draft a clear specification
2. Client review specification
3. Client decide the specification for the MVP.

**Attendees are invited to review these points. Please send feedback or clarifications to ensure the build matches business requirements and that priorities are properly reflected as development begins.**
