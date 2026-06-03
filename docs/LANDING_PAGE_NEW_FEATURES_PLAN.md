# SENDA Landing Page — New Feature Sections Plan

**Source:** Manager's reference deck (8 slides) covering Contact Center, Voice, Agent
Management, Analytics, Integrations, IVR, and GenAI Chatbots.

**Hard constraint:** The hero section (`<section id="about">` in [src/pages/Landing.tsx](src/pages/Landing.tsx)) is locked. We only **insert** new sections after it. Existing Features, Pricing, Calculator, CTA, and Footer stay exactly where they are.

**Design rule:** No AI-template look. Each section gets a custom layout, real product mockups, branded illustrations, and motion. No "3 generic icon cards in a row" sections — every block should feel hand-designed.

---

## 1. What the manager actually asked for

Each deck slide maps to a capability cluster. We group them into 6 narrative sections that read like one product story instead of 8 disconnected lists.

| Deck slide | Capability cluster | Section in landing |
|---|---|---|
| 1. Inbound Chat Handling | Unified omnichannel inbox, multi-WhatsApp/FB/IG, agent transfer, routing, tagging, chatbot↔agent handoff | **§A Omnichannel Inbox** |
| 2. Inbound Voice | Call hold/mute/route/forward, IVR, voicemail, conferencing, SIP/FXO, queue ring strategies, callbacks | **§B Voice & IVR** |
| 7. IVR | Automated call routing, voice surveys, transcription, outbound dialing, multilingual | **§B Voice & IVR** (merged) |
| 3. Agent Management | Role-based access, agent status, drag-drop queue, real-time call lists, coaching (listen/whisper/barge), SLA | **§C Agent Workspace** |
| 8. GenAI Chatbots | GenAI-powered, KB-fed, rich media, multi-language, workflow mapping. KPIs: -45% wait time, -25% calls, +2 NPS | **§D AI Copilots** |
| 4. Reporting — Chat | Open tickets, sessions, resolution time, top agents, tag usage, channel volume | **§E Real-time Analytics** (Chat tab) |
| 5. Reporting — Voice | Voice queue panel, wallboard, agent utilization, missed calls, queue performance | **§E Real-time Analytics** (Voice tab) |
| 6. Integrations | Workflow automation, CRM embedding, Conversation API, multi-channel SDKs | **§F Integrations & Developer Platform** |

This collapses 8 deck slides into 6 narrative sections — denser and more scannable.

---

## 2. Where the new sections go

```
Current page                          After change
─────────────                          ─────────────
[Header]                               [Header]
[Hero #about]              ◄── KEEP    [Hero #about]                ◄── UNCHANGED
[Features]                             [Features]                    ◄── UNCHANGED
                                       ┌─────────────────────────┐
                                       │ §A Omnichannel Inbox    │  ◄── NEW
                                       │ §B Voice & IVR          │  ◄── NEW
                                       │ §C Agent Workspace      │  ◄── NEW
                                       │ §D AI Copilots          │  ◄── NEW
                                       │ §E Analytics            │  ◄── NEW
                                       │ §F Integrations / API   │  ◄── NEW
                                       └─────────────────────────┘
[Pricing]                              [Pricing]                     ◄── UNCHANGED
[Calculator]                           [Calculator]                  ◄── UNCHANGED
[CTA]                                  [CTA]                         ◄── UNCHANGED
[Footer]                               [Footer]                      ◄── UNCHANGED
```

Insert point: between the closing `</section>` of `#features` (around line 1204) and the opening `<section id="pricing">` (around line 1209) in [src/pages/Landing.tsx](src/pages/Landing.tsx).

---

## 3. File structure for the new code

We do **not** dump everything into `Landing.tsx`. We extract each section into its own component under a new folder, then import them in order.

```
src/components/landing/
  ├── OmnichannelInboxSection.tsx       (§A)
  ├── VoiceAndIvrSection.tsx            (§B)
  ├── AgentWorkspaceSection.tsx         (§C)
  ├── AiCopilotsSection.tsx             (§D)
  ├── AnalyticsSection.tsx              (§E)
  ├── IntegrationsSection.tsx           (§F)
  └── shared/
      ├── SectionHeader.tsx             (eyebrow + h2 + lead — reused)
      ├── FeaturePill.tsx               (tag-style chips for capability lists)
      ├── ChannelBadge.tsx              (WhatsApp/FB/IG/SMS icons)
      └── MockupFrame.tsx               (consistent "browser chrome" wrapper)
```

Why split:
- `Landing.tsx` is already 1,563 lines. Adding ~1,500 more inline makes it unmaintainable.
- Each section can be iterated/reviewed independently.
- Reuse: `SectionHeader`, `FeaturePill`, `MockupFrame` are shared.

---

## 4. Section-by-section UI/UX spec

Each section follows the same skeleton (anchor id, eyebrow, h2 with blue accent line, lead paragraph, content block, optional CTA) but the **content block** layout is intentionally different so the page doesn't feel repetitive.

### §A Omnichannel Inbox — *"One inbox. Every channel. Zero context-switching."*

**Anchor:** `#inbox`
**Layout:** Asymmetric split — copy on left (40%), product mockup on right (60%).

**Mockup design:** A custom-built inbox mockup (HTML/CSS, not an image) showing:
- Left rail: conversation list with channel icons (WhatsApp green dot, FB blue, IG gradient, SMS)
- Center: active conversation with text + image bubble
- Right rail: contact info, tags ("VIP", "Sales"), assigned agent

**Copy:**
- Eyebrow: "Customer Conversations"
- H2: *"One inbox for chat, voice and AI — across every channel your customers use."*
- Lead: *"Stop juggling 5 dashboards. WhatsApp, Facebook, Instagram, SMS, and live agents — all in one queue, with smart routing and seamless chatbot-to-human handoff."*

**Capability strip** (below mockup, horizontal pills): Multi-WhatsApp · Multi-FB/IG · Skills-based routing · Auto-assignment · Bot ↔ Agent switch · Tags & segments · Working hours · Post-session surveys

**Motion:** Mockup slides up + fades in on scroll. Channel icons stagger-pop in the left rail. Tag pills fade in last.

---

### §B Voice & IVR — *"Modern voice for modern call centers."*

**Anchor:** `#voice`
**Layout:** Centered title + a **3-column "feature pillars"** grid, each pillar with its own visual aside (vertically stacked, image on top, text below). No flat icon grid.

**The 3 pillars:**

| Pillar | Visual | Copy |
|---|---|---|
| **Smart Call Routing** | Mini IVR tree diagram (3 nodes branching) | ACD, multi-level IVR, skills-based priority queues, callback-on-busy |
| **Full Telephony Suite** | Soft-phone UI mockup with active call controls | Hold, mute, transfer, conference, recording, SIP/FXO, deskphone + mobile + web |
| **Voice Surveys & Outbound** | Bar chart with sentiment buckets | Automated voice surveys, recording + transcription, outbound campaigns, multilingual |

**Capability strip:** Voicemail · Music on hold · Auto greeting · Queue callbacks · CRM popup · Post-call CSAT · API integration

**Motion:** Each pillar slides in from below with 150ms stagger. IVR tree draws lines on scroll-in.

---

### §C Agent Workspace — *"Tools that make agents 2× faster."*

**Anchor:** `#agents`
**Layout:** Reverse split — mockup on left (60%), copy on right (40%). Mirrors §A for visual rhythm.

**Mockup design:** Custom agent dashboard mockup:
- Top KPI strip: "85.16% SLA · 24 Answered · 2 Abandoned"
- "Waiting Calls" table (2–3 rows) with a draggable "transfer" hand icon
- "Active Calls" table below with status pills
- Floating "Whisper" / "Listen" / "Barge" coaching buttons in the corner

**Copy:**
- Eyebrow: "Agent Management"
- H2: *"Give supervisors x-ray vision. Give agents superpowers."*
- Lead: *"Real-time queues, drag-and-drop call distribution, and live coaching (listen, whisper, barge-in) — all from one role-based workspace."*

**Capability strip:** Role-based access · Auto contact matching · Status management · Drag-drop transfer · Coaching tools · Missed-call labeling · SLA tracking · Per-agent reports

**Motion:** KPIs count up from 0. Waiting-calls list types in row by row.

---

### §D AI Copilots — *"GenAI that actually closes cases."*

**Anchor:** `#ai`
**Layout:** Hero-style band with a tinted background (subtle gradient: `from-blue-50 via-white to-blue-50/40`) to visually separate this as a "highlight" section. Three blocks vertically:
1. KPI ribbon: **3 oversized stat cards** (–45% wait time · –25% call volume · +2 NPS) with animated counters.
2. Side-by-side: WhatsApp chatbot mockup (phone frame, real conversation) on the left, capability list on the right.
3. Mini sub-section: "Feed it your knowledge base" with a stylized "drop zone" mockup showing PDF / website / FAQ icons flowing into a brain icon.

**Copy:**
- Eyebrow: "AI Copilots"
- H2: *"Resolve queries 24/7 — instantly, in any language."*
- Lead: *"Generative AI chatbots that read your website and knowledge base, hold natural conversations across WhatsApp, web, and voice, and hand off cleanly to live agents when needed."*

**Capability strip:** GenAI-powered · KB-fed · Rich conversations (images, video, buttons) · Multi-language · Workflow mapping · Round-the-clock

**Motion:** KPI numbers animate count-up. Chat bubbles fade in sequentially (recreates a real chat flow).

---

### §E Real-time Analytics — *"See everything that matters."*

**Anchor:** `#analytics`
**Layout:** Tabbed component — two tabs (`Chat` / `Voice`). Tab content is a dashboard mockup + metric list. Tabs feel native, not bolted on.

**Tab 1 — Chat Analytics:**
- Mockup: Dashboard with "Historical View — 7 days" filters, "Chat Metrics" cards (Total Sessions, Support Time Saved), Top 5 Agents table, twin charts (Open/Resolved cases + Volume per Weekday + Response Rate donut).
- Metric list: Open tickets · Conversations over time · Resolved vs unresolved · Conversations per agent · Avg resolution/response time · Top agents · Tag usage · Channel breakdown

**Tab 2 — Voice Analytics:**
- Mockup: "Voice Wallboard" with Inbound/Outbound KPI cards, agent table with extension stats.
- Metric list: Avg resolution/response time per agent · Call volume · Agent utilization · Extension stats · Missed-call report · Queue performance · Ring-group stats

**Copy:**
- Eyebrow: "Reporting & Analytics"
- H2: *"Every conversation, every call — measured."*
- Lead: *"Live wallboards, historical reports, and exportable analytics for both chat and voice channels. Spot trends, coach agents, prove ROI."*

**Motion:** Tab switch slides content horizontally. Charts draw on first reveal.

---

### §F Integrations & Developer Platform — *"Plug into the systems you already run."*

**Anchor:** `#integrations`
**Layout:** Two-column. Left: 3 stacked "use case" cards (Workflow Automation · Contact Center Integrations · Conversation API). Right: a code snippet mockup showing a real API call (cURL or JS).

**Use case cards:**
1. **Workflow Automation** — "Trigger order status checks, KYC flows, balance inquiries — straight from a customer chat."
2. **Contact Center Integrations** — "Embed CRM and customer history right inside the agent's conversation view."
3. **Conversation API** — "Build your own chatbots across WhatsApp, FB, IG, SMS with one unified API."

**Code snippet mockup:**
```
POST https://api.senda.africa/v1/conversations/send
Authorization: Bearer ••••••••
{
  "channel": "whatsapp",
  "to": "+255615229007",
  "message": { "type": "text", "body": "Hello!" }
}
```
With a small "Copy" affordance and a link to the existing `/developer` page.

**Capability strip:** REST API · Webhooks · SDKs · CRM connectors · Multi-channel · Sandbox keys

**Motion:** Cards slide in from the left, code snippet types itself in character by character (capped at 1s).

---

## 5. Design system rules (consistency across all sections)

| Element | Spec |
|---|---|
| Section spacing | `py-20 sm:py-24 lg:py-28` |
| Section padding | `px-4 sm:px-6 lg:px-8` |
| Max container | `max-w-7xl mx-auto` |
| Eyebrow | `text-xs font-semibold tracking-widest uppercase text-blue-600` |
| H2 | `font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight` |
| H2 accent | Second line wrapped in `<span className="text-blue-600">` |
| Lead paragraph | `text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl` |
| Card radius | `rounded-2xl` (matches existing) |
| Card shadow | `shadow-md hover:shadow-xl transition-shadow` |
| Primary CTA | Reuse existing blue gradient button |
| Mockup chrome | Soft gray border, subtle drop shadow, `rounded-xl`, top "browser dots" bar |
| Color palette | Existing: blue-500/600/700, yellow-400 (popular badge), gray-50/100/600/900. **No new colors.** |
| Icons | Continue with `lucide-react` (already in use) |

**Background alternation** so sections don't blur into each other:
- §A — white
- §B — gray-50
- §C — white
- §D — `bg-gradient-to-br from-blue-50/40 via-white to-blue-50/40`
- §E — white
- §F — gray-50

---

## 6. Motion & interaction

Reuse the existing `useScrollReveal` / `useStaggeredReveal` hooks already wired in [src/pages/Landing.tsx](src/pages/Landing.tsx) and Framer Motion (motion/react) — no new dependencies.

| Pattern | Where |
|---|---|
| Fade-up on scroll | All headers, lead paragraphs |
| Stagger-reveal grids | Capability pills, pillar cards |
| Count-up numbers | §D AI KPIs (45%, 25%, +2 NPS), §C SLA percentages |
| Typed code | §F snippet (use a `useEffect` with `setInterval`, kill on cleanup) |
| Chat-bubble cascade | §A inbox mockup, §D chatbot mockup |
| Reduced motion | All animations respect existing `@media (prefers-reduced-motion: reduce)` block |

---

## 7. i18n (English + Swahili)

The existing landing page already supports `language === 'sw'` ternaries via `LanguageContext`. Every new piece of copy ships with both:

```tsx
{language === 'sw'
  ? 'Sanduku moja kwa simu, chat na AI.'
  : 'One inbox for chat, voice and AI.'}
```

A full EN/SW string sheet will live at the top of each section component for a single source of truth. We'll compile a complete glossary before stage 2.

---

## 8. Navigation updates

Once §A–§F are in, the header nav adds **one** new entry:

- Desktop: "Platform" — opens a small **mega-menu** with links to `#inbox`, `#voice`, `#agents`, `#ai`, `#analytics`, `#integrations`.
- Mobile: a "Platform" group inside the existing `MobileMenu` with the same 6 anchors.

We do **not** add 6 separate top-level nav items (would clutter the header).

Footer nav gets the same 6 anchors under a new "Platform" column.

---

## 9. Implementation phases — strictly sequential

We build and ship one section per phase. Each phase ends with a visual review and your sign-off before the next starts.

### Phase 0 — Scaffolding (no visible change)
- Create `src/components/landing/` and `src/components/landing/shared/` folders.
- Build `SectionHeader.tsx`, `FeaturePill.tsx`, `MockupFrame.tsx`, `ChannelBadge.tsx`.
- Verify no runtime regressions.
- **Deliverable:** Empty shared components, ready to use.

### Phase 1 — §A Omnichannel Inbox
- Build `OmnichannelInboxSection.tsx` with the inbox mockup.
- Mount in `Landing.tsx` between Features and Pricing.
- Validate on mobile, tablet, desktop.
- Validate EN ↔ SW toggle.

### Phase 2 — §B Voice & IVR
- Build `VoiceAndIvrSection.tsx` with the 3-pillar layout.
- Mount after §A.

### Phase 3 — §C Agent Workspace
- Build `AgentWorkspaceSection.tsx` with the agent dashboard mockup.
- Mount after §B.

### Phase 4 — §D AI Copilots
- Build `AiCopilotsSection.tsx` with KPI ribbon, chatbot mockup, KB drop-zone.
- Mount after §C.

### Phase 5 — §E Analytics
- Build `AnalyticsSection.tsx` with Chat/Voice tabs.
- Mount after §D.

### Phase 6 — §F Integrations & API
- Build `IntegrationsSection.tsx` with use-case cards + code snippet.
- Mount after §E.

### Phase 7 — Navigation & polish
- Add "Platform" mega-menu to header.
- Add "Platform" column to footer.
- Add 6 anchors to `MobileMenu`.
- Cross-section spacing audit (no double padding seams).
- Lighthouse pass on the full page.

---

## 10. Acceptance criteria per phase

A phase ships only when:

- [ ] Section renders correctly at 320px, 768px, 1024px, 1440px.
- [ ] No layout shift / horizontal scroll.
- [ ] Hero section visual is **byte-identical** to the pre-change version.
- [ ] EN and SW copies both render with no fallback strings showing.
- [ ] All animations honor `prefers-reduced-motion`.
- [ ] No new console errors or TypeScript errors.
- [ ] No new dependencies added.
- [ ] Mockups use real product visuals (HTML/CSS), not stock illustrations or emoji.

---

## 11. Risk & rollback

- **Risk:** Page becomes too long → mitigated by tight spacing and alternating backgrounds.
- **Risk:** SEO impact from h2 proliferation → use the proper heading hierarchy (h2 per section, h3 inside).
- **Risk:** Mobile performance → mockups are CSS, not images; lazy-load only the dashboard mockup illustration if needed.
- **Rollback:** Each section is one component import in `Landing.tsx`. Comment out the import + JSX usage to remove a section in seconds.

---

## 12. What we are NOT doing

Just so this stays scoped:
- ❌ Touching the Hero, Features grid, Pricing, Calculator, CTA, or Footer.
- ❌ Replacing existing colors or fonts.
- ❌ Adding new third-party libraries (no chart libs, no animation libs beyond Framer/motion already in use).
- ❌ Building separate `/voice`, `/inbox`, `/ai` routes. Everything lives on the landing page as anchors.
- ❌ Generating any AI/template-looking content. Every mockup is custom-built.

---

## 13. Next step

Once you approve this plan, we start **Phase 0** (scaffolding only — invisible to users). After that, we iterate one section at a time, reviewing each in the browser before moving to the next.
