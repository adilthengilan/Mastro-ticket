# Mastrotickets — Design System & UI Specification

**Product:** Mastrotickets  
**Purpose:** Design reference for Google AI Studio implementation  
**Brand:** Hungary-based Formula 1 ticketing marketplace  
**Design direction:** Ticketmaster-inspired ticket commerce + cinematic Formula 1 visual identity  
**Primary theme:** Dark  
**Status:** UI/UX specification; not a claim of official Formula 1 affiliation

---

## 1. Design North Star

Create a premium, dark ticket-booking experience that feels as polished and easy to navigate as a major ticket marketplace, with the dramatic imagery and editorial energy of Formula 1.

The design should combine:

- **Ticket marketplace conventions:** searchable events, clear dates and locations, visible starting prices, filters, ticket categories, quantity controls, transparent order summaries and a straightforward checkout.
- **Formula 1 atmosphere:** full-bleed circuit photography, race-car imagery, strong typography, racing-red accents, Grand Prix branding and premium hospitality imagery.
- **Mastrotickets identity:** a distinct logo, original copy, consistent design tokens and original interface details.

Use Ticketmaster as a reference for general commerce patterns and information hierarchy, not as a source to copy proprietary logos, artwork, source code or exact protected page designs.

## 2. Brand Design Tokens

### Colors

| Token | Hex | Usage |
|---|---|---|
| `color-bg` | `#0B0B10` | Main application background |
| `color-bg-secondary` | `#121218` | Secondary sections and page regions |
| `color-surface` | `#19191F` | Event cards, panels and ticket cards |
| `color-surface-elevated` | `#222229` | Inputs, dropdowns, hover states |
| `color-brand-primary` | `#E10600` | Primary CTA, selected states, key highlights |
| `color-brand-hover` | `#FF3434` | Hover and active accent |
| `color-text-primary` | `#FFFFFF` | Main text and headings |
| `color-text-secondary` | `#B4B4BE` | Supporting copy and metadata |
| `color-text-muted` | `#858591` | Muted labels and tertiary metadata |
| `color-border` | `#303039` | Card outlines and dividers |
| `color-success` | `#36C98F` | Confirmed, available and successful states |
| `color-warning` | `#F5B942` | Low inventory and pending states |
| `color-error` | `#FF5B62` | Failed actions and validation errors |

**Color rules**

- Use dark backgrounds across the main storefront and admin panel.
- Use racing red deliberately for primary actions, selected ticket options and meaningful emphasis.
- Keep body text readable and avoid low-contrast gray-on-gray combinations.
- Do not use red for every decorative element.
- Avoid excessive gradients, neon glow and glassmorphism.
- Use success, warning and error colors only for their semantic meanings.

### Typography

- **Headings:** Space Grotesk or a similar strong modern sans-serif.
- **Body/UI:** Inter or a similar highly legible sans-serif.
- **Numerical values:** tabular numerals for prices, quantities and order totals where supported.
- Use bold editorial headings for race-focused sections and restrained, readable typography for checkout and forms.

Suggested type scale:

| Style | Desktop | Mobile | Weight |
|---|---:|---:|---|
| Display | 56–72 px | 36–44 px | 700–800 |
| H1 | 40–48 px | 30–36 px | 700 |
| H2 | 30–36 px | 24–28 px | 700 |
| H3 | 22–26 px | 20–22 px | 600–700 |
| Body large | 18 px | 17 px | 400–500 |
| Body | 16 px | 16 px | 400 |
| Caption | 12–14 px | 12–14 px | 400–500 |

### Layout and spacing

- Use a centered content container with a maximum width around 1280–1440 px.
- Use a consistent 4 px spacing base.
- Main section spacing: approximately 64–96 px desktop and 40–56 px mobile.
- Card padding: approximately 16–24 px.
- Form controls: minimum 44 px touch height.
- Use a consistent grid and alignment system.
- Prefer subtle borders and restrained shadows over heavy effects.

### Shape and elevation

- Buttons: 6–10 px corner radius.
- Inputs: 8–10 px corner radius.
- Event cards: 10–14 px corner radius.
- Large imagery: 8–14 px corner radius, or square edges for cinematic hero artwork.
- Use thin borders to distinguish surfaces on dark backgrounds.
- Avoid making every element a rounded pill.

---

## 3. Global Navigation

### Desktop header

Build a compact, sticky header with:

1. Mastrotickets wordmark and original logo.
2. Grand Prix.
3. Race Calendar.
4. Concerts.
5. Premium Experiences.
6. Search.
7. Help.
8. Account / Sign In.
9. Cart icon with item count.

The header should remain readable over the dark background. On top of hero imagery, it may begin transparent and transition to a solid dark surface after scrolling.

### Mobile header

- Logo on the left.
- Cart and menu controls on the right.
- A collapsible navigation drawer.
- Essential account and ticket-discovery links must remain easy to reach.
- Never let the menu obscure checkout or prevent keyboard navigation.

### Footer

Include About, Contact, Help, Ticket Delivery, Refund Policy, Terms, Privacy, Cookie Preferences, company details and social links. Do not claim official Formula 1 affiliation unless a valid agreement exists.

---

## 4. Homepage Design

### 4.1 Cinematic hero

**Goal:** Immediately communicate Formula 1, premium ticket access and a clear next step.

Layout:
- Wide, cinematic circuit or race-car image.
- Dark overlay/gradient to protect text contrast.
- Small eyebrow label such as `THE GRAND PRIX COLLECTION`.
- Headline: **YOUR NEXT GRAND PRIX STARTS HERE.**
- Supporting line: “Discover race weekends, grandstand seats and premium experiences.”
- Primary button: `EXPLORE RACE TICKETS`.
- Secondary link/button: `DISCOVER PREMIUM`.
- Optional event search with Grand Prix, country or circuit.
- If showing a specific event, use verified event details only.

Use licensed or otherwise authorized imagery. Optimize images and provide a fallback if loading fails.

### 4.2 Featured Grand Prix

Display a horizontally scrollable row or responsive grid of event cards.

Each card contains:
- Event artwork.
- Grand Prix name.
- Country and circuit.
- Date range with timezone handled correctly.
- Starting price and currency.
- Availability label based on current data.
- `VIEW TICKETS` action.

Design:
- Dark surface, thin border and restrained hover lift.
- Image ratio around 16:9 or 4:3 depending on the card layout.
- Consistent card heights.
- Prices visually prominent but secondary to event identity.
- Do not show sold-out events as available.

### 4.3 Choose your race day

Use a clear day-selector component with:
- Thursday
- Friday
- Saturday
- Sunday
- Full Weekend
- Multi-day packages, when configured

Each option displays its date/session summary and starting price. Only show days available for that event. Distinguish a single-day ticket from a multi-day package clearly.

### 4.4 Premium experiences

Use a more editorial layout for premium products:
- Grandstand upgrades.
- Hospitality suites.
- Paddock packages.
- Other authorized VIP experiences.

Use premium photography, short factual descriptions and clear inclusion lists. Never promise access that is not included in the actual product.

### 4.5 After-race concerts

Display concert cards with:
- Artist/lineup only when confirmed.
- Date, venue and event location.
- Standalone ticket price.
- Eligibility rules.
- A clear `ADD TO BOOKING` or `VIEW CONCERT` action.

Clearly indicate whether a concert ticket is independent or requires a qualifying race ticket.

### 4.6 Supporting homepage sections

- Upcoming race calendar.
- Why book with Mastrotickets.
- Ticket category explainer.
- Customer support links.
- FAQs.
- Newsletter signup only with appropriate consent.
- Full legal and support footer.

Do not fill the homepage with generic placeholder news or fake testimonials.

---

## 5. Event Listing Page

**Route:** `/races`

Layout:
- Page title and short introduction.
- Search input.
- Filters for date, country, price, ticket availability and premium experiences.
- Sort by date, price or featured status.
- Responsive grid of Grand Prix cards.
- Pagination or “Load more”.
- Empty state with filter reset.
- Loading skeletons and recoverable error state.

On desktop, filters may use a sidebar or toolbar. On mobile, use a filter drawer with an obvious Apply button and visible active-filter count.

Every result must be based on real Firestore-backed event data or clearly labelled development fixtures.

---

## 6. Event Detail and Ticket Selection

**Route:** `/races/[slug]`

### Page structure

1. Event hero with race name, location and date range.
2. Event overview and circuit information.
3. Day/session selector.
4. Ticket category list.
5. Seat-map or category-based selection.
6. Concert and premium add-ons.
7. Delivery and ticket-condition information.
8. Price breakdown.
9. FAQs and support.
10. Related events.

### Ticket cards

Each ticket card should show:
- Ticket type.
- Day or session.
- Section/category.
- Short description.
- Price and currency.
- Availability from authoritative inventory.
- Quantity control.
- Selection state.
- Details link or expandable inclusions.

Avoid dense blocks of copy. Keep price, category and action easy to scan.

### Quantity controls

- Use minus and plus buttons with accessible labels.
- Respect min/max limits.
- Disable controls at their limits.
- Update totals immediately in the UI.
- Revalidate quantity and price on the server before reserving inventory.

### Seat selection

When a supplier provides authorized seat-level inventory:
- Display a simplified, responsive venue map.
- Provide section, row and seat details.
- Distinguish available, selected, unavailable and temporarily held seats.
- Include a category/seat list alternative for accessibility.
- Show price and selected-seat summary.

When exact seat inventory is unavailable, show category selection rather than a fictional seat map.

---

## 7. Cart and Checkout

### Cart — `/cart`

Use a two-column desktop layout:
- Main column: selected ticket items.
- Side column: sticky order summary.

On mobile, stack the summary below the items or use a clear expandable summary.

Each cart item includes:
- Event name and date.
- Ticket day/type.
- Seat/section if applicable.
- Quantity.
- Unit price.
- Line total.
- Remove action.

Order summary:
- Subtotal.
- Fees.
- Taxes, where calculable.
- Discounts.
- Final total.
- Currency.
- Continue shopping.
- Proceed to checkout.

Do not hide mandatory fees until after the customer commits to payment.

### Checkout — `/checkout`

Use a calm, distraction-free dark layout. Keep the order summary visible on desktop.

Sections:
1. Account/sign-in step where required.
2. Customer and billing details.
3. Attendee details when required.
4. Ticket and delivery summary.
5. Terms and ticket conditions.
6. Payment through Stripe Checkout or a supported Stripe integration.
7. Clear processing, success and failure states.

Show a secure-payment explanation without making unsupported security guarantees. Do not collect or store raw card details in the Mastrotickets backend.

A return to the success URL is not proof of payment. Confirm payment on the backend using verified Stripe events.

---

## 8. Customer Account UI

Routes:
- `/login`
- `/register`
- `/forgot-password`
- `/account`
- `/account/orders`
- `/account/orders/[orderId]`
- `/account/tickets`
- `/account/invoices`
- `/account/profile`

Visual treatment:
- Dark background with clear content panels.
- Simple side navigation on desktop.
- Tabs or a compact menu on mobile.
- Readable status badges.
- Order tables that transform into stacked cards on mobile.

Account overview:
- Upcoming events.
- Recent orders.
- Ticket delivery status.
- Payment/refund status.
- Quick links to invoices and support.

Never display another user's data or rely solely on frontend route hiding for access control.

---

## 9. Admin Panel Design

**Main route:** `/admin-panel/home`

The admin panel uses the same dark design language but prioritizes information density, clarity and operational efficiency over cinematic presentation.

### Layout

- Collapsible left sidebar.
- Compact top bar with global search, notifications and staff profile.
- Breadcrumbs.
- Main content area.
- Responsive data tables.
- Filters and pagination.
- Clear action menus.
- Confirmation dialogs for destructive actions.
- Toasts and inline error messages.

### Sidebar navigation

- Dashboard
- Events
- Tickets & Inventory
- Seating
- Concerts
- Premium Packages
- Orders
- Payments
- Refunds
- Invoices
- Customers
- Staff & Roles
- Emails
- Marketing
- Discounts
- Reports
- Settings
- Audit Logs

### Dashboard

Use a restrained grid of metric cards:
- Gross sales.
- Orders.
- Tickets sold.
- Available inventory.
- Pending payments.
- Refunds.
- Delivery failures.

Below the metrics:
- Sales chart.
- Recent orders.
- Upcoming events.
- Low-inventory warnings.
- Failed payment/email alerts.

All values must come from real data or be clearly marked as development fixtures. Do not create fake live analytics.

### Tables

- High-contrast column headers.
- Subtle row dividers.
- Clear hover state.
- Status badge with text, not color alone.
- Search and filter controls.
- Pagination.
- Mobile-friendly horizontal scrolling or stacked row cards.
- Bulk actions only where authorization and confirmation are appropriate.

### Admin forms

Use labelled controls, field-level validation, explicit Save/Cancel actions and unsaved-change warnings where appropriate. Destructive actions require confirmation and must be logged.

---

## 10. Reusable Component Library

Build and reuse components instead of duplicating page-specific UI.

### Global
- `SiteHeader`
- `MobileNavigation`
- `SiteFooter`
- `SearchBar`
- `Breadcrumbs`
- `Button`
- `IconButton`
- `Modal`
- `Drawer`
- `Toast`
- `Skeleton`
- `EmptyState`
- `ErrorState`
- `Pagination`

### Events and tickets
- `GrandPrixCard`
- `EventHero`
- `RaceDaySelector`
- `TicketTypeCard`
- `TicketQuantitySelector`
- `SeatMap`
- `SeatLegend`
- `PremiumPackageCard`
- `ConcertCard`
- `AvailabilityBadge`
- `PriceBreakdown`

### Commerce
- `CartItem`
- `CartSummary`
- `CheckoutSteps`
- `CustomerDetailsForm`
- `OrderConfirmation`
- `PaymentStatus`
- `InvoicePreview`

### Account
- `AccountSidebar`
- `OrderCard`
- `OrderStatusBadge`
- `TicketDeliveryStatus`
- `AccountProfileForm`

### Admin
- `AdminSidebar`
- `AdminHeader`
- `MetricCard`
- `DataTable`
- `FilterToolbar`
- `StatusBadge`
- `ConfirmDialog`
- `AuditLogTable`

---

## 11. Interaction and Motion

Use subtle motion to improve clarity:
- Fast, restrained hover transitions.
- Smooth but brief menu/drawer transitions.
- Clear selected states for ticket days and categories.
- Quantity updates without layout jumps.
- Loading skeletons while data is retrieved.
- Inline validation near the relevant control.

Respect reduced-motion preferences. Avoid long cinematic transitions in checkout, excessive parallax, auto-playing sound or animation that delays ticket purchase.

---

## 12. Responsive Rules

### Desktop
- Full navigation.
- Multi-column event grids.
- Two-column cart and checkout layouts.
- Sticky order summary when useful.
- Expanded admin sidebar and tables.

### Tablet
- Reduced card columns.
- Compact navigation.
- Collapsible filters.
- Simplified seat-map controls.
- Tables with selected columns or horizontal scrolling.

### Mobile
- Single-column content.
- Compact header and accessible menu.
- Large touch targets.
- Full-width primary actions.
- Stacked ticket cards and summaries.
- Filter drawer.
- Accessible seat-selection alternative.
- No horizontal overflow.
- Persistent cart access without covering important content.

Test at narrow mobile widths, common iPhone and Android sizes, tablets and large desktop screens.

---

## 13. Accessibility and Usability

- Maintain readable text contrast.
- Use semantic HTML.
- Provide keyboard navigation and visible focus.
- Give icons accessible labels.
- Use real labels for every form input.
- Announce important asynchronous status changes accessibly.
- Do not communicate status by color alone.
- Provide a list-based alternative to interactive seating.
- Ensure dialogs manage focus correctly.
- Respect reduced-motion preferences.
- Keep validation errors specific and actionable.

---

## 14. Image and Content Rules

- Use licensed, authorized or otherwise appropriate Formula 1/circuit imagery.
- Use Cloudinary for optimized image delivery when configured.
- Provide meaningful alt text.
- Use appropriate responsive aspect ratios.
- Avoid blurry, stretched or repetitive imagery.
- Do not use fake sponsor logos or imply sponsorship agreements.
- Do not invent confirmed concert lineups or official event details.
- Clearly label sample event data and prices.
- Use real supplier data before presenting tickets as genuinely available.

Suggested image direction:
- Hero: cinematic 16:9 racing image.
- Event cards: 16:9 or 4:3 circuit imagery.
- Concert cards: 4:3 stage photography.
- Premium packages: hospitality imagery.
- Ticket/seat selection: simplified schematic map where real inventory supports it.

---

## 15. Frontend States

Every data-driven page must account for:

1. Loading.
2. Successful data display.
3. Empty result.
4. API failure.
5. Unavailable event.
6. Sold-out ticket.
7. Price changed.
8. Reservation expired.
9. Payment pending.
10. Payment failed.
11. Email delivery pending or failed.
12. Authentication expired.

Display helpful recovery actions. Never show a successful order or issued ticket based only on an optimistic frontend state.

---

## 16. Design Acceptance Checklist

Before accepting the UI, verify:

- [ ] Dark theme is consistently applied.
- [ ] Formula 1 visual identity is unmistakable.
- [ ] The result feels like a premium ticket marketplace, not a generic template.
- [ ] Header and navigation work on desktop and mobile.
- [ ] Event cards show date, location, starting price and status.
- [ ] Race-day selection is clear and functional.
- [ ] Multiple ticket days can be combined.
- [ ] Ticket quantity controls work and respect limits.
- [ ] Seat selection is based on supported inventory.
- [ ] Cart totals update correctly.
- [ ] Fees, taxes and currency are clearly presented.
- [ ] Checkout has loading, success and failure states.
- [ ] Customer pages are responsive and access-controlled.
- [ ] Admin tables and forms are usable on small screens.
- [ ] Buttons and links have real, defined actions.
- [ ] Images have suitable fallbacks and alt text.
- [ ] Keyboard focus and contrast are accessible.
- [ ] No horizontal overflow occurs at mobile widths.
- [ ] No fake inventory or payment success is presented as real.
- [ ] The Mastrotickets brand is original and consistent.

---

## 17. Google AI Studio Design Instruction

Use this file as the UI/UX source of truth while implementing Mastrotickets.

Build a premium, dark, Formula 1-themed ticket marketplace with the clarity and interaction quality of a leading ticket-booking platform. Use the supplied design tokens, page structures, reusable components, interaction rules and responsive requirements.

Start by implementing the design system, global navigation, homepage, race listing, event detail, ticket-day selector, ticket categories, cart and checkout screens using clearly labelled sample data. Ensure all primary controls work.

Then connect the screens to the PHP REST API and Firestore-backed data model. Never treat sample data as real ticket inventory, and never fake payment success or ticket delivery.

Preserve the dark theme and Formula 1 identity across every public page. The admin panel should use the same design tokens with a more information-dense operational layout.

Do not stop at a static homepage. Build a cohesive, navigable application with reusable components, responsive layouts, loading/error states, functional interactions and a documented integration boundary for services that require credentials or supplier authorization.
